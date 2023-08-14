import React, { useState, useEffect, useCallback, } from "react";
import { connect } from "react-redux";
import { Button } from "@mui/material";
import axios from "axios";
import { resetSearch, searchPhoto } from "../actions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleNotch,
  faSync,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import QRCode from 'qrcode';

import "./Photo.scss";

function Photo({
  reset,
  searchPhoto,
  predictionPending,
  predictionResponse,
  prediction,
  predictionError,
  minScore,
  labelSettings,
  status,
}) {
  const [image, setImage] = useState(null);
  const [catalog, setCatalog] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(null);
  const [clothes, setClothes] = useState([])
  const [video, setVideo] = useState(null);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const [imageCanvas, setImageCanvas] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [zonesCanvas, setZonesCanvas] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [qrCodeUrl, setQRCodeUrl] = useState('');

  useEffect(() => {
    enableCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    drawDetections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prediction]);

  useEffect(() => {
    const currentAddress = window.location.href;
    QRCode.toDataURL(currentAddress, function(err, url) {
      if (err) throw err;
      setQRCodeUrl(url);
    });
  }, []);

  const videoRef = useCallback(
    (node) => {
      setVideo(node);
      if (node) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode } })
          .then((stream) => (node.srcObject = stream));
      }
    },
    [facingMode]
  );

  const imageCanvasRef = useCallback((node) => {
    setImageCanvas(node);
  }, []);

  const zonesCanvasRef = useCallback((node) => {
    setZonesCanvas(node);
  }, []);

  function enableCamera() {
    setCameraEnabled(!cameraEnabled);
    setImage(null);
  }

  function onCameraToggled() {
    reset();
    enableCamera();
  }

  function onCameraClicked() {
    updateImageCanvas();

    let imageData = imageCanvas.toDataURL("image/jpeg");
    const base64data = imageData.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
    searchPhoto(base64data);
  }

  function updateImageCanvas() {
    setVideoWidth(video.videoWidth);
    setVideoHeight(video.videoHeight);

    if (!imageCanvas) {
      return;
    }

    imageCanvas.width = video.videoWidth;
    imageCanvas.height = video.videoHeight;

    imageCanvas.getContext("2d").drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    video.srcObject.getVideoTracks().forEach((track) => {
      track.stop();
    });

    setImage(imageCanvas.toDataURL());
    setCameraEnabled(false);
  }

  function drawDetections() {
    if (!prediction || !prediction.detections || !imageCanvas.getContext) {
      return;
    }
    const displayBox = prediction.displayBox;
    prediction.detections.filter((d) => d.score > minScore).forEach((d) => drawDetection(d,displayBox));
  }

  function drawDetection({ box, label, score, cValue }, displayBox) {
    const drawScore = true;
    const textBgHeight = 14;
    const padding = 2;
    const letterWidth = 6;
    const scoreWidth = drawScore ? 4 * letterWidth : 0;
    const text = drawScore ? `${label} ${Math.floor(score * 100)}% Confidence` : label;

    const width = Math.floor((box.xMax - box.xMin) * imageCanvas.width);
    const height = Math.floor((box.yMax - box.yMin) * imageCanvas.height);
    const x = Math.floor(box.xMin * imageCanvas.width);
    const y = Math.floor(box.yMin * imageCanvas.height);
    const labelSetting = labelSettings[label];
    const labelWidth = text.length * letterWidth + scoreWidth + padding * 2;

    const ctx = imageCanvas.getContext("2d");
    if (displayBox) {
      drawBox(ctx, x, y, width, height, labelSetting.bgColor);
      drawBoxTextBG(ctx, x, y + height - textBgHeight, labelWidth, textBgHeight, labelSetting.bgColor);
      drawBoxText(ctx, text, x + padding, y + height - padding);
    }
    //clearZone(ctx, x + 5, y + height - textBgHeight - 4, labelWidth, textBgHeight);
    //clearZone(ctx, x, y, width, height);
  }

  function drawBox(ctx, x, y, width, height, color) {
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 15]);
    ctx.strokeStyle = color;
    ctx.strokeRect(x, y, width, height);
  }

  function drawBoxTextBG(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1.0;
  }

  function drawBoxText(ctx, text, x, y) {
    ctx.font = "12px Verdana";
    ctx.fillStyle = "white";
    ctx.fillText(text, x, y);
  }

  function onFacingModeClicked() {
    if (facingMode === "user") {
      setFacingMode("environment");
    } else {
      setFacingMode("user");
    }
  }

  function renderCamera() {
    if (!cameraEnabled || image) {
      return null;
    }

    return (
      <div className="camera">
        <div className="img-preview">
          <div className="img-container">
            <video
              className="camera-preview"
              ref={videoRef}
              controls={false}
              autoPlay
              playsInline
            />
          </div>
        </div>
        <div className="left-button-container button-container">
          <Button
            variant="contained"
            size="large"
            className="choose-camera-button"
            onClick={onFacingModeClicked}
          >
            <FontAwesomeIcon icon={faSync} />
          </Button>
        </div>
        <div className="center-button-container button-container">
          <Button
            variant="contained"
            size="large"
            className="take-picture-button"
            onClick={onCameraClicked}
          >
            <FontAwesomeIcon icon={faCircle} />
          </Button>
        </div>
      </div>
    );
  }

  function renderSnapshot() {
    const displayResult = image ? {} : { display: "none" };
    const displayButtons = predictionPending ? { display: "none" } : {};
    const displayLoading = predictionPending ? {} : { display: "none" };

    const displayError =
      !predictionPending && predictionError
        ? { width: `${videoWidth}px`, height: `${videoHeight}px` }
        : { display: "none" };

    const displayImage =
      !predictionPending && !predictionError && prediction ? {} : { display: "none" };


    let displayNoObjects;

    displayNoObjects = { display: "none" }; // Never show no objects

    return (
      <div className="result" style={displayResult}>
        <div className="img-preview">
          <div className="error-container" style={displayError}>
            <h2>
              <FontAwesomeIcon className="error-icon" icon={faExclamationCircle} /> Error
            </h2>
            <code>{JSON.stringify(predictionError, null, 2)}</code>
          </div>
          <div className="img-container" style={displayImage}>
            <canvas className="result-canvas" ref={imageCanvasRef} />
            <div className="zones overlay">
              <canvas className="zones-canvas" ref={zonesCanvasRef} />
            </div>
            <div className="loading overlay" style={displayLoading}>
              <div>
                <FontAwesomeIcon className="loading-icon" icon={faCircleNotch} spin />
              </div>
              <div className="loading-text">Loading ...</div>
            </div>
            <div className="no-objects overlay" style={displayNoObjects}>
              <div className="no-objects-text">No Objects</div>
              <div className="no-objects-text">Found</div>
            </div>
          </div>
        </div>
        <div className="left-button-container button-container" style={displayButtons}>
        <Button
            variant="contained"
            size="large"
            onClick={SendToInventory}
          >
            <span className="label-word">Sell it</span>
          </Button>

        </div>
        <div className="center-button-container button-container" style={displayButtons}>
          <Button
            variant="contained"
            size="large"
            className="re-take-picture-button"
            onClick={onCameraToggled}
          >
            <span className="label-word">Try again </span>
          </Button>
        </div>
        <div className="right-button-container button-container" style={displayButtons}></div>
      </div>
    );
  }

  function renderQRCode() {
    const displayQRcode = image ? {} : { display: "none" };

    return (
      <div className="img-preview">
        <img src={qrCodeUrl} alt="QR Code" style={displayQRcode} />
      </div>
    );
  }

  function displayCatalog(){
    const displayCatalogLayout = catalog ? {} : { display: "none" };
    return (
      <div className="my-catalog" style={displayCatalogLayout}>
        <h3>My catalog 2</h3> 
        {clothes.map((clothe) =>(
          <div>
           <div> API : {clothe.API} </div> 
           
           <div> Desc : {clothe.Description} </div>
           </div>))}
      </div>
    )
  }

  return (
    <div className="photo">
      {renderCamera()}
      {renderSnapshot()}
      {renderQRCode()}
      {displayCatalog()}
    </div>
  );


  function SendToInventory(){

    axios.get(`https://api.publicapis.org/entries`)
   .then(response => {

    let items = response?.data;

    setClothes(items['entries'])
     setImage(false)
     setCatalog(true)
     
    console.log("data raw ",items['entries'])

    //console.log("photo prediction ",prediction.detections)
    console.log("photo sent to inventory")
   /* return(
      <div>
      {clothes['entries'].map((obj, i) => {
        return (
          <div key={i}>
            <p>{obj?.API}</p>
          </div>
        );
      })}
    </div>
  );
    */
   
  })
  .catch(error=>{
    console.error("error api",error)
  })

}
}

function mapStateToProps(state) {
  return { ...state.appReducer, ...state.photoReducer };
}

function mapDispatchToProps(dispatch) {
  return {
    reset: () => {
      dispatch(resetSearch());
    },
    searchPhoto: (photo) => {
      dispatch(searchPhoto(photo));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Photo);

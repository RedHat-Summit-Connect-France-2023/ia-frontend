import "@patternfly/react-core/dist/styles/base.css";
import React, { useState, useEffect, useCallback, } from "react";
import { connect } from "react-redux";
//import { Button } from "@mui/material";
import axios from "axios";
import testPhoto from "./prediction.PNG"
import { resetSearch, searchPhoto } from "../actions";
import {
  Form,
  FormGroup,
  TextInput,
  Checkbox,
  Popover,
  Divider,
  ActionGroup,
  Radio,
  Button,
  HelperText,
  HelperTextItem,
  FormHelperText,
  Bullseye,
  Card,
  CardHeader,
  CardActions,
  CardFooter,
  CardTitle,
  CardBody,
  Dropdown,
  DropdownToggle,
  DropdownItem,
  DropdownSeparator,
  DropdownPosition,
  DropdownToggleCheckbox,
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  EmptyStateSecondaryActions,
  FormSelect,
  FormSelectOption,
  Gallery,
  KebabToggle,
  OverflowMenu,
  OverflowMenuControl,
  OverflowMenuDropdownItem,
  OverflowMenuItem,
  PageSection,
  PageSectionVariants,
  Pagination,
  Select,
  SelectOption,
  SelectVariant,
  TextContent,
  Text,
  Title,
  Toolbar,
  ToolbarItem,
  ToolbarFilter,
  ToolbarContent
} from '@patternfly/react-core';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleNotch,
  faSync,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import QRCode from 'qrcode';

import "./Photo.scss";
import "./fonts.css"
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
  const [productPrediction, setProductPrediction] = useState(false)
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
  const [pseudo,setPseudo] = useState()
  const [pseudoDefined,setPseudoDefined] = useState(false)
  const [itemToSell,setItemToSell] = useState(false)


  const userSession = 'aaabbbbaaaa'
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
    console.log(" cam click 1")
    setQRCodeUrl(false)
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
    const displayResult = pseudoDefined ? {} : { display: "none" };
    console.log("RenderCamera ", pseudoDefined)
    if (!cameraEnabled || image) {
      return null;
    }
    //after prediction returned
    // display the sellingLayout
    console.log("RenderCamera 2 ", displayResult)
    return (

      <div className="camera" style={displayResult}>
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
            onClick={getCatalog}
          >
            <span className="label-word">Show my dressing</span>
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
   // const displayQRcode = image ? {} : { display: "none" };
   // hide qr code
   // to do , add main variable outside as image ..

   const displayQRcode = qrCodeUrl ? {} : { display: "none" };
    return (
      <div className="img-preview">
        <img src={qrCodeUrl} alt="QR Code" style={displayQRcode} />
      </div>
    );
  }


  const handlePseudoCreation = (_event) => {
   
    console.log("PSEUDO submit ",pseudo)
    setQRCodeUrl(false)
    
    setPseudoDefined(true)

  }

  const handlePseudoName = (_event,name: string) => {
    setPseudo(name)
  }

  function definePseudo(){
    const displayPseudo = !pseudoDefined ? {} : { display: "none" };

    return (
      <Card ouiaId="BasicCard" style={displayPseudo}>
    <CardTitle>Red Hat Peer-to-Peer Shop</CardTitle>
    <CardBody>
  
      <Form>
            <FormGroup
              label="Saisissez un pseudo pour votre dressing"
                  
              isRequired
              fieldId="simple-form-name-01"
            >
              <TextInput
                isRequired
                type="text"
                id="simple-form-name-01"
                name="userPseudo"
                aria-describedby="simple-form-name-01-helper"
                onChange={handlePseudoName}
              />
              </FormGroup>
            <ActionGroup>
              <Button variant="primary" onClick={handlePseudoCreation}>C'est parti !</Button>
            </ActionGroup>
            </Form>
            </CardBody>
            </Card>
    )
  }

  function sellAnItem(){

    const categories = [
      {
        groupLabel: 'Group1',
        disabled: false,
        options: [
          { value: '1', label: 'tshirt', disabled: false }
          
        ]
      }
    ]
   
    return (
      <div id="selling-form">
      <form>
      <label>
        Pick your favorite flavor:
        <select id="select-id">
          <option value="tshirt" title="tshirt">tshirt</option>
          <option value="chemise" title="chemise">chemise</option>
          <option value="manteau" title="manteau">manteau</option>
          <option value="pull" title="pull">pull</option>
          <option value="pantalon, bas" title="pantalon, bas">pantalon, bas</option>
          <option value="chaussures" title="chaussures">chaussures</option>
          <option value="ensemble" title="ensemble">ensemble</option>
          <option value="lunettes" title="lunettes">lunettes</option>
          <option value="cravatte" title="cravatte">cravatte</option>
          <option value="montre" title="montre">montre</option>
          <option value="foulard" title="foulard">foulard</option>
          <option value="redhat" title="redhat">redhat</option>
          <option value="sac" title="sac">sac</option>
          <option value="parapluie" title="parapluie">parapluie</option>
          <option value="accessoire" title="accessoire">accessoire</option>
</select>
      </label>
      <input type="submit" value="Submit" />
    </form>
          </div>
    )
  }

  const handleEditItem = (index) => {
    return() =>{
    console.log("CLICK GRID")


    const dataset1 = {
      detections: [
      {
      box: [Object],
      class: 'redhat',
      label: 'Redhat',
      score: 0.9655831456184387
      },
      {
      box: [Object],
      class: 'tshirt, chemise',
      label: 'Tshirt, chemise',
      score: 0.6621403098106384
      }
      ],
      image_url: 'https://minio-object-detection.apps.cluster-4nfxq.4nfxq.sandbox3107.opentlc.com/images/dG90bw==/b55e6a76-a56a-4c0a-85c6-911c95a48d33.jpg'
      }

    const dataset =
            [{
          box: "test",
          class: 'redhat',
          label: 'Redhat',
          score: 0.9655831456184387
          },
          {
          box: "test",
          class: 'tshirt, chemise',
          label: 'Tshirt, chemise',
          score: 0.6621403098106384
          }
        ]
        console.log(" dataset raw 0",dataset1)
    console.log(" dataset raw ",dataset1["detections"])
   //console.log(" dataset raw1 ",dataset["detections"])
    //console.log(" dataset raw2 ",dataset[0]["detections"])

   
    setProductPrediction(dataset1["detections"])
    // clothes set to comment for testing object detection
    //setClothes([clothes[index]])
    setItemToSell(true)
    setCatalog(false)
    console.log("EDIT Item ",index)

    console.log("clothe ",clothes[index])
 
  }
}




 function renderItemToSell(){
  
        const itemToSellDisplay = itemToSell ? {} : { display: "none" };
        const options = [
          { value: "tshirt" , label : "tshirt" },
          { value: "chemise" , label : "chemise" },
          { value: "manteau" , label : "manteau" },
          { value: "pull" , label : "pull" },
          { value: "pantalon, bas" , label : "pantalon, bas" },
          { value: "chaussures" , label : "chaussures" },
          { value: "ensemble" , label : "ensemble" },
          { value: "lunettes" , label : "lunettes" },
          { value: "cravatte" , label : "cravatte" },
          { value: "montre" , label : "montre" },
          { value: "foulard" , label : "foulard" },
          { value: "redhat" , label : "redhat" },
          { value: "sac" , label : "sac" },
          { value: "parapluie" , label : "parapluie" },
          { value: "accessoire" , label : "accessoire" }
        ]
       

        console.log("RAW Predicts ",productPrediction)
        let  clotheToEdit

        if(!productPrediction){
          clotheToEdit = clothes
        }
        else{
          clotheToEdit = productPrediction
        }
        // hide catalog 

        console.log("ClotheToEdit ",clotheToEdit)
        return(
          <div className="sell-item"  style={itemToSellDisplay}> 
    <div class="pf-v5-l-gallery pf-m-gutter">
          {clotheToEdit.map((clothe,index) =>(
             

          <Card ouiaId="BasicCard">
          <CardBody>
  
        <Form>
        <FormGroup
          label="Description" isRequired fieldId="simple-form-name-01" >
          <TextInput isRequired type="text" value={clothe.description} id="simple-form-name-01" name="descriptipn" aria-describedby="simple-form-name-01-helper"/>
        </FormGroup>
        <FormGroup
          label="Name" isRequired fieldId="simple-form-name-01" >
          <TextInput isRequired type="text" value={clothe.label} id="simple-form-name-01" name="clotheName" aria-describedby="simple-form-name-01-helper"/>
        </FormGroup>
        <FormGroup label="Item Category">
        <FormSelect 
          id="category"
          aria-label="FormSelect Input"
          value={clothe.class}
          isRequired fieldId="simple-form-name-01" >
          {options.map((option, index) => (
            <FormSelectOption
              key={index}
              value={option.value}
              label={option.label}
            />
          ))}
        </FormSelect>
        </FormGroup>
        <ActionGroup>
          <Button variant="primary" onClick={handlePseudoCreation}>C'est parti !</Button>
        </ActionGroup>
        </Form>
        </CardBody>
        </Card>
          ))
          }
    </div>
          </div>
        )
      }
  
  function renderCatalog(){
    const productsToSellLayout = catalog ? {} : { display: "none" };
    return (
    <div className="item-catalog" style={productsToSellLayout}>
        <div
      class="pf-v5-l-gallery pf-m-gutter"
    >
  
  {clothes.map((clothe,index) =>(
  
  <Card ouiaId="BasicCard">

    <CardTitle>{clothe.description}</CardTitle>
    <CardBody>{clothe.name}</CardBody> 
    <CardBody>Quantity remaining : <div class="pf-u-font-weight-bold">{clothe.quantity}</div></CardBody>  
    <CardBody>{clothe.price}</CardBody>
    <CardFooter>
    <Button onClick={handleEditItem(index)} variant="secondary" size="small">
      Edit
    </Button>
    </CardFooter>
    <Divider component="div" />

  </Card>


))}
</div>
</div>)

    
  }



  


         
         

  
  return (
    <div className="photo">
    {definePseudo()}
    {renderCamera()}
    {renderSnapshot()}
    {renderQRCode()}
    {renderCatalog()}
    {renderItemToSell()}
      
    </div>
  );

 
  
  

  function GetObjectPrediction(){
  
    console.log("called getobj")
    axios.get(`http://localhost:8083/products`)

   .then(response => {

    let items = response?.data;

     setClothes(items)
     setImage(true)
     setCatalog(false)
     setQRCodeUrl(false)
     setProductPrediction(true)
    console.log("data raw ",items)

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


  function getCatalog(){

    axios.get(`http://localhost:8083/products`)
   .then(response => {

    let items = response?.data;

     setClothes(items)
     setCatalog(true)
     
    console.log("data raw ",items)

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

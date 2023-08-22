import axios from "axios";
import { call, put, takeLatest } from "redux-saga/effects";
import { createAxiosErrorNotification } from "../Notifications";
import {
  SEARCH_PHOTO,
  searchPhotoFulfilled,
  searchPhotoPending,
  searchPhotoRejected,
} from "./actions";

const apiUrl = "/api/images";
const userSession = 'aaabbbbaaaa'

function* executeSearchPhoto(action) {
  yield put(searchPhotoPending());
  try {
    const myBody = new FormData();
    myBody.append("image",action.payload.photo)
    myBody.append("userId",userSession)

    // const response = yield call(axios.post, photoApiUrl, {photo: action.payload.photo});
    const response = yield call(axios, {
      method: "POST",
      url: apiUrl,
      data: {
        myBody
      },
    });
    yield put(searchPhotoFulfilled(response));
  } catch (error) {
    yield put(createAxiosErrorNotification(error));
    yield put(searchPhotoRejected(error));
  }
}

export function* watchSearchPhoto() {
  yield takeLatest(SEARCH_PHOTO, executeSearchPhoto);
}

const exportedObject = [watchSearchPhoto()];

export default exportedObject;

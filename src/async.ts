/* async is used for backend calls, and takes care of redux actions
   use eg backend.get('FETCH_TEST','test') will get BACKEND_URL/test
   and create actions of type 'FETCH_TEST' and async its result:
   - FETCH_TEST/FULFILLED or
   - FETCH_TEST/FAILED
*/

import Axios, { AxiosResponse } from 'axios';
import { Action } from 'redux';
import { Epic } from 'redux-observable';
import { Observable } from 'rxjs/Rx';
import { BACKEND_URL } from './constants';

export enum Method {
    GET,
    POST,
    UPLOAD
}

export interface IFetchAction extends Action {
  id: number;
  fetchAction: boolean;
  method: Method;
  url: string;
  headers?: any;
  data?: any;
}

export interface IFetchFulfilledAction extends IFetchAction { status: number; response?: any; }
export interface IFetchFailedAction extends IFetchAction { status: number; response?: any; error: string; }

let incrementalID = 0;
export const createFetchAction = (
  type: string,
  method: Method,
  url: string,
  data: any = {},
  headers: any = {}
): IFetchAction => {
  incrementalID += 1;

  return {id: incrementalID, fetchAction: true, type, method, url, data, headers};
};

class Token {
  private value: string|null;
  public get = () => {
    if (!this.value && window.localStorage ) { this.value = localStorage.getItem('access_token'); }

    return this.value;
  }
  public set = (newToken: string) => {
    this.value = newToken;
    if (window.localStorage) { localStorage.setItem('access_token', newToken); }
  }
  public clear = () => {
    this.value = null;
    if (window.localStorage) { localStorage.removeItem('access_token'); }
  }
}
export const accessToken = new Token();

export const backend = {
  get: (name: string, params: string): IFetchAction => createFetchAction(
    name,
    Method.GET,
    `${BACKEND_URL}/${params}`,
    {},
    { token: accessToken.get() }
  ),
  post: (name: string, params: string, data: any): IFetchAction => createFetchAction(
    name,
    Method.POST,
    `${BACKEND_URL}/${params}`,
    data,
    { token: accessToken.get() }
  ),
  upload: (name: string, file: File): IFetchAction => createFetchAction(
    name,
    Method.UPLOAD,
    `${BACKEND_URL}/upload`,
    file,
    { token: accessToken.get() }
  )
};

export const rawReq = {
  get: (params: string) =>
    Axios.get(
      `${BACKEND_URL}/${params}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'token': accessToken.get()
        },
        responseType: 'json'
    })
};

export const fetchEpic: Epic<IFetchAction, {}> = (action$) =>
  action$.filter((action) => action.fetchAction).mergeMap(
      (action: IFetchAction): Observable<any> => {
        let req = null;

        if (action.method === Method.GET) {
          req = Axios.get(action.url, {
            headers: { ...action.headers, 'Content-Type' : 'application/json' },
            responseType: 'json'
          });
        } else if (action.method === Method.POST) {
          req = Axios.post(action.url, action.data, {
            headers: {...action.headers, 'Content-Type': 'application/json'},
            responseType: 'json'
          });
        } else { // is upload
          const data = new FormData();
          data.append('file', action.data);

          const config = {
            headers: { 'content-type': 'multipart/form-data' }
            // onUploadProgress: (progressEvent: any) => {
            //   const percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
            //   console.log(percentCompleted);
            // };
          };
          req = Axios.put(action.url, data, config);
        }

        return Observable.fromPromise(req)
          .map((response: AxiosResponse): IFetchFulfilledAction => ({
            ...action,
            fetchAction: false, // set to false to avoid looping
            response: response.data,
            status: response.status,
            type: `${action.type}/FULFILLED`
          }))
          .catch((e: any): Observable<IFetchFailedAction> =>
            Observable.of({
              ...action,
              error: e.toString(),
              fetchAction: false, // set to false to avoid looping
              response: (e.response && e.response.data) || null,
              status: (e.response && e.response.status) || null,
              type: `${action.type}/FAILED`
            })
          );
      }
  );

export const reducer = (state: any = [], action: IFetchAction) => {
  if ('fetchAction' in action) {
    if (action.fetchAction) { // new
      return [ ...state, action];
    } else { // fulfilled or failed
      const index = state.findIndex((asyncAction: any) => asyncAction.id === action.id);
      const newState = [...state];
      newState[index] = { ...newState[index], status : 'DONE' };

      return newState;
    }
  } else {
    return state;
  }
};

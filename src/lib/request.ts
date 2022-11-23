import axios from 'axios';
import * as dayjs from 'dayjs';
import { MD5 } from 'crypto-js';
import { debug } from './utils';

const CONFIG = process.env;

axios.defaults.baseURL = CONFIG.end_point;

axios.interceptors.request.use(
  async (config) => {
    config.headers = {
      ...config.headers,
      Accept: 'application/json; charset=UTF-8',
      'Content-Type': 'application/json',
      'Accept-Encoding': '',
    };
    debug('客户端发送', config.data);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axios.interceptors.response.use((response) => {
  debug('服务器返回', response.data);
  if (!response) {
    return Promise.reject('服务器返回数据为空');
  }
  const { data } = response;

  if (data.UNI_BSS_HEAD.RESP_CODE !== '00000') {
    throw new Error(data.UNI_BSS_HEAD.RESP_DESC);
  }
  return data.UNI_BSS_BODY;
});

/**
 * 包装请求，添加中台校验逻辑
 * @param uri 接口地址
 * @param data 业务数据
 * @returns 返回值
 */
export const request = async <T>(uri: string, data: any): Promise<T> => {
  const now = dayjs();
  const trans_id =
    now.format('YYYYMMDDHHmmssSSS') + Math.random().toFixed(6).slice(-6);
  return await axios.post<any, T>(uri, {
    UNI_BSS_HEAD: {
      APP_ID: CONFIG.app_id,
      TIMESTAMP: now.format('YYYY-MM-DD HH:mm:ss SSS'),
      TRANS_ID: trans_id,
      TOKEN: MD5(
        `APP_ID${CONFIG.app_id}TIMESTAMP${now.format(
          'YYYY-MM-DD HH:mm:ss SSS',
        )}TRANS_ID${trans_id}${CONFIG.app_secret}`,
      ).toString(),
    },
    UNI_BSS_BODY: data,
  });
};

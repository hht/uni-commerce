/**
 * 推送消息类型 1-订单 2-发货单 3-退货 4-结算 5-地址 6-妥投 驳回信息
 */
type OrderMessageType = '1' | '2' | '3' | '4' | '5' | '6';

type OrdersRequest = {
  type: OrderMessageType;
  /**
   * 是否查询后立即删除消息 0-否 1-是
   */
  is_del: 0 | 1;
};

type InvoiceRequest = {
  sendOrderNo: string;
  /**
   * 处理类型 1-新增
   */
  sendType: '1';
  /**
   * 发货单状态 1-正常
   */
  state: 1;
  /**
   * 发货状态 1-已发货
   */
  sendState: '1';
  /**
   * 物流信息获取类型 1-第三方标准物流 2-供应商提供物流信息查询url 3-自有物流(物流信息由供应商通过物流信息推送接口推送)4-供应商提供物流
   */
  logisticsType: 1 | 2 | 3 | 4;
  logisticsCom?: string;
  logisticsNo?: string;
  logisticsComNo?: string;
  /**
   * 供应商物流配送信息查询 URL(当 logisticsType=2时，将使用该字段数据)
   */
  logisticsUrl?: string;
  sendingContacts?: string;
  curPage: string;
  totalPage: string;
  packingList: any;
};

type Message<T> = {
  msgId: string;
  type: OrderMessageType;
  msgInfo: T;
  msgTime: string;
};

type OrderMessage = {
  orderNo: string;
  /**
   * 消息类型 0-新增订单 1-订单变更 2-取消订 单
   */
  stype: 0 | 1 | 2;
  time: string;
};

interface Response {
  UNI_BSS_HEAD: {
    /**
     * 返回描述
     */
    RESP_DESC: string;
    /**
     * 接入标识码
     */
    APP_ID: string;
    /**
     * 返回码 00000 代表成功，其它异常代码详见附录
     */
    RESP_CODE: string;
    /**
     * 时间戳
     */
    TIMESTAMP: string;
    /**
     * 序列号
     */
    TRANS_ID: string;
  };
}

interface ProviderResponse {
  /**
   * 返回值:true/false
   */
  success: boolean;
  /**
   * 如果 success=false 时，将错误信息表述返回到该字段上;
   */
  resultMessage: string;
  /**
   * 平台业务代码标记
   */
  resultCode: string;
  isEvent: number;
}
interface AccessTokenResponse extends Response {
  ACCESS_TOKEN_RSP: {
    result: {
      /**
       * 返回的令牌
       */
      access_token: string;
      /**
       * 时间
       */
      time: number;
      state: null;
      /**
       * 超时时间
       */
      expire_in: number;
    };
  } & ProviderResponse;
}

interface ProviderRespose<T> extends Response {
  PROVIDER_API_RSP: {
    /**
     * 业务数据
     */
    result: T;
  } & ProviderResponse;
}

interface Result {
  success: boolean;
  message: string;
}

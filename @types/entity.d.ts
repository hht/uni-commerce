type Package = {
  id?: number;
  eDetailId: string;
  eGoodName: string;
  eGoodsAlias?: string;
  eSku: string;
  ePsku: string;
  eItemNumber?: string;
  eNakedPrice: number;
  eUnitPrice: number;
  eTaxPrice: number;
  eTaxRate: number;
  eNum: number;
  eUnitOfMeasure: string;
};

type OrderDetails = {
  goods_name: string;
  itemNumber: string | null;
  nakedPrice: number;
  /**
   * 是否组合商品 0: 不是 1: 是; 该字段为 1 时，设备清单必填
   */
  isPack: '0' | '1';
  goods_code: string | null;
  /**
   * 是否需要SN码或MAC码 0:否 1:SN 必填 2:MAC 必填 3:SN 与 MAC 必填
   */
  needCheckSn: '0' | '1' | '2' | '3';
  snLength: string;
  num: string;
  detailId: string;
  spec: string[];
  taxRate: number;
  unit: string;
  /**
   * 装箱方式:1-按照订单商品装箱;2-按订单商品的组件
   */
  box_type: string;
  price: number;
  p_sku: string;
  taxPrice: number;
  sku: string;
  linePackInfo?: Package[];
};
type Order = {
  //orderType: "0";
  companyName: string | null;
  county: string;
  hangupReason: string;
  bill_bankno: string | null;
  receiveStatus: string | null;
  bill_to_email: string | null;
  /**
   * 订单状态 0-已取消 1-正常 2-挂起
   */
  orderState: string;
  extendValue3: string | null;
  extendValue4: string | null;
  extendValue5: string | null;
  province: string;
  extendValue1: string | null;
  bill_bank: string | null;
  extendValue2: string | null;
  createNameMobile: string;
  extendField3: string | null;
  /**
   * 发票类型:1、普通发票 2、增值税普通发票 3、增值税专用发票
   */
  invoiceType: string;
  extendField2: string | null;
  extendField1: string | null;
  comCode: string;
  extendField5: string | null;
  extendField4: string | null;
  zip: string;
  invoiceContent: string | null;
  projectValue: string | null;
  orderNo: string;
  orgName: string;
  town: string;
  companyTel: string | null;
  phone: string | null;
  name: string;
  fullAddress: string;
  comName: string;
  /**
   * 发票:纳税人识别号
   */
  bill_taxcode: string | null;
  projectName: string | null;
  createName: string;
  realPrice: number | null;
  city: string;
  contractNo: string;
  orderNakedPrice: number;
  /**
   * 开票方式(1 为随货开票， 2 为集中开票 )
   */
  invoiceState: string;
  remark: string | null;
  bankName: string;
  bill_toer: string | null;
  /**
   * 付款类型 0、后付，1、货到付款，2、在线支付
   */
  paymentType: string;
  bill_to_address: string | null;
  bill_to_contact: string | null;
  nakedRealPrice: number;
  nakedDrawBackPrice: number;
  bankNo: string;
  orderPrice: number;
  taxNo: string;
  email: string;
  comSubName: string;
  address: string;
  /**
   * 发票抬头 1 个人，2 单位
   */
  selectedInvoiceTitle: '1' | '2';
  mobile: string;
  bill_tel: string | null;
  bill_address: string | null;
  ouName: string;
  orderDetails: OrderDetails[];
  drawBackPrice: number;
  companyAddress: string;
  orderTaxPrice: number;
};

type Invoice = {
  sendOrderNo: string;
  state: string;
  sendState: string;
  logisticsType: string;
  logisticsCom?: string;
  logisticsComNo?: string;
  logisticsNo?: string;
  logisticsUrl?: string;
  sendingContacts?: string;
  curPage: string;
  totalPage: string;
  packingList: any;
  delivered?: Delivered;
};

type Delivered = {
  deliveredId: string;
  token: string;
  method: string;
  order: string;
  orderNo: string;
  p_sendOrderNo: string;
  sendOrderNo: string;
  deliveredName: string;
  deliveredMobile: string;
  deliveredTime: string;
  remark?: string;
  signer: string;
  signMobile: string;
  attachment: string;
};

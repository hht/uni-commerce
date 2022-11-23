import * as dayjs from 'dayjs';
import * as util from 'util';

/**
 * 控制台打印输出
 * @param label 标签
 * @param data 内容
 */
export const debug = (label: string, data: any) => {
  console.log(
    label,
    util.inspect(data, {
      depth: null,
      colors: true,
    }),
  );
};

/**
 * 生成以当前时间戳加随机数为名的ID
 * @param length 长度
 * @returns
 */
export const uniq = (length = 6) =>
  dayjs().format('YYYYMMDDHHmmssSSS') +
  Math.random().toFixed(length).slice(-length);

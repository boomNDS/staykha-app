import QRCode from "qrcode";

export type PromptPayType = "PHONE" | "NATIONAL_ID" | "EWALLET";

const normalizePromptPayId = (value: string, type: PromptPayType) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\s+/g, "").replace(/-/g, "");
  if (type === "PHONE") {
    // Thai phone: convert 0XXXXXXXXX -> 66XXXXXXXXX
    if (digits.startsWith("0")) {
      return `66${digits.slice(1)}`;
    }
  }
  return digits;
};

const formatAmount = (amount: number) => amount.toFixed(2);

const crc16 = (payload: string) => {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j += 1) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
};

const tlv = (id: string, value: string) =>
  `${id}${value.length.toString().padStart(2, "0")}${value}`;

const buildMerchantAccount = (id: string, type: PromptPayType) => {
  const typeId = type === "PHONE" ? "01" : type === "NATIONAL_ID" ? "02" : "03";
  const aid = tlv("00", "A000000677010111");
  const idValue = tlv(typeId, id);
  const combined = `${aid}${idValue}`;
  return tlv("29", combined);
};

export const createPromptPayPayload = (
  id: string,
  type: PromptPayType,
  amount?: number,
) => {
  const normalized = normalizePromptPayId(id, type);
  if (!normalized) return "";

  const payloadFormat = tlv("00", "01");
  const pointOfInitiation = tlv("01", amount ? "12" : "11");
  const merchantAccount = buildMerchantAccount(normalized, type);
  const country = tlv("58", "TH");
  const currency = tlv("53", "764");

  const amountField = amount ? tlv("54", formatAmount(amount)) : "";
  const checksumId = "6304";
  const withoutCrc = `${payloadFormat}${pointOfInitiation}${merchantAccount}${currency}${amountField}${country}${checksumId}`;
  const checksum = crc16(withoutCrc);
  return `${withoutCrc}${checksum}`;
};

export const createPromptPayQrDataUrl = async (
  id: string,
  type: PromptPayType,
  amount?: number,
): Promise<string | null> => {
  const payload = createPromptPayPayload(id, type, amount);
  if (!payload) return null;
  return QRCode.toDataURL(payload, {
    width: 220,
    margin: 1,
  });
};

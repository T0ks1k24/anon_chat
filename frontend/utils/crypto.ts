export async function deriveKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("anon-chat-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(text: string, key: CryptoKey): Promise<string> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const cipher = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(text)
  );

  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join("");
  const cipherHex = Array.from(new Uint8Array(cipher)).map(b => b.toString(16).padStart(2, "0")).join("");
  
  return ivHex + ":" + cipherHex;
}

export async function decryptMessage(encryptedHex: string, key: CryptoKey): Promise<string> {
  if (!encryptedHex.includes(":")) return encryptedHex; // Fallback for unencrypted old messages
  
  try {
    const [ivHex, cipherHex] = encryptedHex.split(":");
    
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const cipher = new Uint8Array(cipherHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      cipher
    );
    
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (e) {
    console.error("Decryption failed", e);
    return "[Encrypted Message]";
  }
}

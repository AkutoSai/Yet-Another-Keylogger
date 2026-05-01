import base64
import re
import os

# Must match your JS salt exactly
SALT = "Test@1234!!!"


def extract_encoded_data(xml_content: str) -> str:
    match = re.search(r"<Data>(.*?)</Data>", xml_content, re.DOTALL)
    if not match:
        raise ValueError("No <Data> section found")
    return match.group(1).strip()


def xor_decode(data: bytes, salt: str) -> str:
    decoded_chars = []
    for i, byte in enumerate(data):
        decoded_byte = byte ^ ord(salt[i % len(salt)])
        decoded_chars.append(chr(decoded_byte))
    return "".join(decoded_chars)


def decode_xml_file(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        xml_content = f.read()

    encoded = extract_encoded_data(xml_content)
    decoded_bytes = base64.b64decode(encoded)
    return xor_decode(decoded_bytes, SALT)


def process_folder(folder_path: str, output_file: str):
    files = sorted([f for f in os.listdir(folder_path) if f.lower().endswith(".xml")])

    success = 0
    skipped = 0

    with open(output_file, "w", encoding="utf-8") as out:
        for filename in files:
            full_path = os.path.join(folder_path, filename)

            try:
                decoded = decode_xml_file(full_path)

                # Optional: extract timestamp from filename
                timestamp_match = re.search(r"_(\d{8}T\d{6})", filename)
                header_time = timestamp_match.group(1) if timestamp_match else "UNKNOWN_TIME"

                out.write(f"\n===== FILE: {filename} | {header_time} =====\n")
                out.write(decoded + "\n")

                success += 1

            except Exception as e:
                print(f"[SKIPPED] {filename} -> {e}")
                skipped += 1

    print("\nDone.")
    print(f"Processed: {success}")
    print(f"Skipped:   {skipped}")
    print(f"Output:    {output_file}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python decode_all.py <folder_path>")
        sys.exit(1)

    folder = sys.argv[1]
    output = os.path.join(folder, "decoded.txt")

    process_folder(folder, output)

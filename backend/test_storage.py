
from app.storage import upload_file, download_file, delete_file

test_path = "connection-test/test.pdf"

# Minimal PDF test content
test_content = b"%PDF-1.4\n% Storage connection test\n%%EOF"

try:
    upload_file(
        test_path,
        test_content,
        "application/pdf"
    )
    print("1. PDF UPLOAD SUCCESSFUL")

    downloaded = download_file(test_path)

    if downloaded == test_content:
        print("2. PDF DOWNLOAD SUCCESSFUL")

    delete_file(test_path)
    print("3. TEST PDF DELETED")

except Exception as error:
    print("STORAGE TEST FAILED:", error)

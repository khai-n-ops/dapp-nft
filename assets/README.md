# Thư mục hình ảnh NFT

Đặt file hình tại đây trước khi upload lên IPFS (Pinata).

**Gợi ý workshop:**
- Tạo hình bằng AI (DALL·E, Midjourney) hoặc pixel art
- Đặt tên: `1.png`, `2.png`, ... khớp token ID
- Kích thước khuyến nghị: 512×512 px

Sau khi upload, cập nhật field `image` trong `metadata/*.json`:

```json
"image": "ipfs://QmYourAssetsCID/1.png"
```

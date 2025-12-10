# Signature Injection Engine

A full-stack "Signature Injection Engine" that bridges browser coordinates (CSS pixels, top-left origin) with PDF coordinates (points at 72 DPI, bottom-left origin).

## 🎯 The Problem

- **Browsers** use CSS Pixels relative to the **Top-Left**
- **PDFs** use Points (72 DPI) relative to the **Bottom-Left**
- **Screens** vary in size (Mobile vs. Desktop), but the **PDF is static**

## 🧮 The Solution: Percentage-Based Normalization

Store positions as **percentages (0-1 range)** making them resolution-independent:

```javascript
// Frontend: Browser → Percentages
const normalized = {
  xPercent: fieldX / containerWidth,      // 0-1 range
  yPercent: fieldY / containerHeight,     // 0-1 range
  widthPercent: fieldWidth / containerWidth,
  heightPercent: fieldHeight / containerHeight
};

// Backend: Percentages → PDF Points (with Y-axis flip!)
const pdfX = xPercent * pdfPageWidth;
const pdfY = pdfHeight - (yPercent * pdfHeight) - boxHeight;  // FLIP Y!
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| PDF Viewing | react-pdf (PDF.js) |
| Drag & Drop | react-dnd |
| Signature | react-signature-canvas |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| PDF Processing | pdf-lib |
| Hashing | SHA-256 (Node.js crypto) |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Open Browser
Navigate to `http://localhost:5173`

## 📂 Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PDFViewer/         # PDF rendering + field overlays
│   │   │   ├── FieldToolbar/      # Draggable field sources
│   │   │   ├── SignatureCanvas/   # Draw signatures
│   │   │   └── DocumentEditor/    # Main app orchestration
│   │   ├── utils/
│   │   │   └── CoordinateTransformer.js  # ⭐ THE KEY MATH
│   │   └── services/
│   │       └── api.js
│
├── backend/
│   ├── models/
│   │   ├── Document.js            # PDF metadata + hashes
│   │   ├── Field.js               # Normalized positions (0-1)
│   │   └── AuditLog.js            # Hash chain audit trail
│   ├── routes/
│   │   ├── documents.js           # Upload, get, audit
│   │   ├── fields.js              # CRUD for fields
│   │   └── signPdf.js             # ⭐ THE KEY ENDPOINT
│   └── utils/
│       ├── hashUtils.js           # SHA-256 hashing
│       └── pdfUtils.js            # ⭐ Coordinate transformation
```

## 🔑 Key Files to Review

1. **`frontend/src/utils/CoordinateTransformer.js`** - Browser ↔ Percentage conversion
2. **`backend/utils/pdfUtils.js`** - Percentage → PDF points + Y-axis flip
3. **`backend/routes/signPdf.js`** - Complete signing workflow with aspect ratio preservation

## 🎥 Demo Flow

1. **Upload** a PDF document
2. **Drag & Drop** fields (Signature, Text, Date, etc.) onto pages
3. **Resize** fields using corner handles
4. **Switch to Signer Mode** and fill the fields
5. **Sign & Download** the final PDF with embedded signatures

## 🔒 Security Features

- **SHA-256 Hashing**: Before & after signing for tamper detection
- **Audit Trail**: Complete history stored in MongoDB
- **Hash Chain**: Blockchain-like verification of document history

## 📱 Responsiveness

The percentage-based system ensures:
- Place a field on Desktop (1920px) at 50%
- View on Mobile (375px) - field is still at 50%
- PDF output is always correct regardless of viewing device

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload PDF |
| GET | `/api/documents/:id` | Get document + fields |
| GET | `/api/documents/:id/audit` | Get audit trail |
| POST | `/api/fields` | Create field |
| PUT | `/api/fields/:id` | Update field position |
| DELETE | `/api/fields/:id` | Delete field |
| POST | `/api/fields/:id/value` | Set field value |
| POST | `/api/sign-pdf` | Generate signed PDF |

## License

MIT

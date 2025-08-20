import { useState } from "react";

export default function InvoicePage() {
  const [rows, setRows] = useState([{ name: "", price: "", qty: "", total: "0.00" }]);

  function calculateRow(i, field, value) {
    const newRows = [...rows];
    newRows[i][field] = value;

    const price = parseFloat(newRows[i].price) || 0;
    const qty = parseFloat(newRows[i].qty) || 0;
    newRows[i].total = (price * qty).toFixed(2);

    setRows(newRows);
  }

  function addRow() {
    setRows([...rows, { name: "", price: "", qty: "", total: "0.00" }]);
  }

  function removeRow(i) {
    if (rows.length === 1) return;
    setRows(rows.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      customer_name: formData.get("customer_name"),
      customer_address: formData.get("customer_address"),
      customer_phone: formData.get("customer_phone"),
      doc_type: formData.get("doc_type"),
      invoice_number: formData.get("invoice_number"),
      invoice_date: formData.get("invoice_date"),
      items: rows,
    };

    const res = await fetch("/api/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("Error generating PDF");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoice.pdf";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <h2>Experts Technology, Sangli</h2>
      <h3>Invoice / Quotation Generator</h3>

      <form onSubmit={handleSubmit} className="form">
        <label>Customer Name</label>
        <input type="text" name="customer_name" required />

        <label>Customer Address</label>
        <input type="text" name="customer_address" required />

        <label>Customer Phone Number</label>
        <input type="text" name="customer_phone" required />

        <label>Document Type</label>
        <select name="doc_type">
          <option value="invoice">Invoice</option>
          <option value="quotation">Quotation</option>
        </select>

        <label>Invoice Number</label>
        <input type="text" name="invoice_number" placeholder="INV001" required />

        <label>Date</label>
        <input type="date" name="invoice_date" defaultValue={new Date().toISOString().slice(0, 10)} required />

        <h3>Items</h3>
        <table className="items-table">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Item Name</th>
              <th>Price (₹)</th>
              <th>Quantity</th>
              <th>Total (₹)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td data-label="S. No.">{i + 1}</td>
                <td data-label="Item Name">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => calculateRow(i, "name", e.target.value)}
                    required
                  />
                </td>
                <td data-label="Price (₹)">
                  <input
                    type="number"
                    value={row.price}
                    onChange={(e) => calculateRow(i, "price", e.target.value)}
                    required
                    style={{ textAlign: "right" }}
                  />
                </td>
                <td data-label="Quantity">
                  <input
                    type="number"
                    value={row.qty}
                    onChange={(e) => calculateRow(i, "qty", e.target.value)}
                    required
                    style={{ textAlign: "right" }}
                  />
                </td>
                <td data-label="Total (₹)">
                  <input type="text" value={row.total} readOnly style={{ textAlign: "right" }} />
                </td>
                <td data-label="Action">
                  <button type="button" onClick={() => removeRow(i)}>❌</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="button-group">
          <button type="button" onClick={addRow}>➕ Add Item</button>
          <button type="submit">🧾 Generate PDF</button>
        </div>
      </form>

      <style jsx>{`
        .page {
          margin: 20px;
          font-family: Arial, sans-serif;
          background: #f7f7f7;
          padding: 10px;
        }
        h2, h3 {
          text-align: center;
          color: #333;
        }
        .form {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          max-width: 900px;
          margin: auto;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        input, select {
          width: 100%;
          padding: 8px;
          margin-top: 5px;
          margin-bottom: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-sizing: border-box;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 8px;
          text-align: left;
        }
        th {
          background: #c8dcff;
          text-align: center;
        }
        .button-group {
          text-align: center;
          margin-top: 20px;
        }
        button {
          padding: 8px 14px;
          font-size: 14px;
          margin: 5px;
          cursor: pointer;
          border-radius: 5px;
          border: none;
          background-color: #007BFF;
          color: white;
        }
        button:hover {
          background-color: #0056b3;
        }

        /* 📱 Mobile Responsive */
        @media (max-width: 768px) {
          table, thead, tbody, th, td, tr {
            display: block;
            width: 100%;
          }
          thead {
            display: none;
          }
          tr {
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 8px;
            background: #fafafa;
          }
          td {
            display: flex;
            justify-content: space-between;
            padding: 6px 4px;
            border: none;
          }
          td:before {
            content: attr(data-label);
            font-weight: bold;
            flex: 1;
            padding-right: 10px;
          }
          td input {
            width: 60%; /* keep fields readable */
          }
        }
      `}</style>
    </div>
  );
}

'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

export default function ItemImport() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as (string[])[];
    const [headers, ...rows] = raw;

    const formatted = rows.map((row) =>
      headers.reduce((obj, key, i) => {
        obj[key] = row[i];
        return obj;
      }, {} as Record<string, any>)
    );

    setItems(formatted);

  };


  const handleImport = async () => {
    setLoading(true);

    const token = localStorage.getItem('invenly_token');
    const decoded = JSON.parse(atob(token!.split('.')[1]));
    const manager = decoded.username;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/item/import-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manager, items }),
    });

    const result = await res.json();

    if (res.status === 401) {
      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      localStorage.setItem('pendingRequest', JSON.stringify({ manager, items }));
      window.location.href = '/login';
    }

    setLoading(false);
    alert(result.message);
  };

  return (
    <div className="p-6 space-y-4">
      <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} />
      <button
        disabled={loading || items.length === 0}
        onClick={handleImport}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Đang nhập...' : 'Nhập sản phẩm'}
      </button>
      <pre className="bg-muted p-4 text-sm rounded max-h-64 overflow-auto">
        {JSON.stringify(items, null, 2)}
      </pre>
    </div>
  );
}

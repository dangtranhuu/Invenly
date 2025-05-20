'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { withAuthGuard } from '@/lib/withAuthGuard'; // Đường dẫn đúng đến file bạn đã có

export default function ScanPage() {
  const scannerRef = useRef<any>(null);
  const [code, setCode] = useState<string | null>(null);
  const [item, setItem] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannedRef = useRef(false);
  const router = useRouter();

  const handleResult = async (scannedCode: string) => {
    if (scannedRef.current || scannedCode === code) return;
    scannedRef.current = true;
    setCode(scannedCode);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/item/code/${scannedCode}`);
      if (!res.ok) throw new Error('Không tìm thấy sản phẩm');
      const data = await res.json();
      setItem(data);
      setForm(data);
      setEditing(false);
      setError(null);
    } catch (err: any) {
      setItem(null);
      setError(err.message || 'Lỗi khi gọi API');
    }

    setTimeout(() => {
      scannedRef.current = false;
    }, 3000);
  };

  useEffect(() => {
    withAuthGuard(async () => {
      const { Html5Qrcode } = await import('html5-qrcode');

      const container = document.getElementById('reader');
      if (container) container.innerHTML = '';

      const scanner = new Html5Qrcode('reader');
      scannerRef.current = scanner;

      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText: string) => handleResult(decodedText),
        () => { }
      ).catch((err) => {
        console.error('🚫 Không thể mở camera:', err);
      });
    }, router, '/login', '/scan');
  }, [router]);



  const handleUpdate = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/item/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      alert(data.message || 'Đã cập nhật');
      setItem(data.item || item);
      setEditing(false);
    } catch (err) {
      alert('Cập nhật thất bại');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Quét mã QR sản phẩm</h2>

      <div id="reader" className="w-full max-w-xs mx-auto border rounded overflow-hidden" />

      {code && <p className="text-sm text-muted-foreground">Mã quét: <code>{code}</code></p>}
      {error && <p className="text-red-500">⚠ {error}</p>}

      {item && (
        <div className="bg-white rounded shadow p-4 space-y-3">
          {editing ? (
            <>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tên sản phẩm"
                className="w-full border rounded px-3 py-2"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả"
                className="w-full border rounded px-3 py-2"
              />
              <div className="space-y-2">
                <h4 className="font-medium">Thuộc tính mở rộng</h4>
                {form.attributes?.map((attr: any, index: number) => (
                  <div key={index} className="flex gap-2">
                    <input
                      className="border px-2 py-1 rounded w-1/2"
                      value={attr.key}
                      onChange={(e) => {
                        const attrs = [...form.attributes];
                        attrs[index].key = e.target.value;
                        setForm({ ...form, attributes: attrs });
                      }}
                      placeholder="Tên thuộc tính"
                    />
                    <input
                      className="border px-2 py-1 rounded w-1/2"
                      value={attr.value}
                      onChange={(e) => {
                        const attrs = [...form.attributes];
                        attrs[index].value = e.target.value;
                        setForm({ ...form, attributes: attrs });
                      }}
                      placeholder="Giá trị"
                    />
                    <button
                      className="text-red-500"
                      onClick={() => {
                        const attrs = [...form.attributes];
                        attrs.splice(index, 1);
                        setForm({ ...form, attributes: attrs });
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  className="text-sm text-blue-600 underline"
                  onClick={() => {
                    const newAttrs = [...(form.attributes || []), { key: "", value: "" }];
                    setForm({ ...form, attributes: newAttrs });
                  }}
                >
                  + Thêm thuộc tính
                </button>
              </div>
              <input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="Nguồn"
                className="w-full border rounded px-3 py-2"
              />
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Loại (thu_vien, qua_tang, vat_pham)"
                className="w-full border rounded px-3 py-2"
              />

              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt={form.name}
                  className="h-32 mt-2 rounded object-contain"
                />
              )}

              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append('image', file);

                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/item/${item._id}/upload-image`, {
                    method: 'POST',
                    body: formData,
                  });

                  const data = await res.json();
                  if (data.imageUrl) {
                    setForm({ ...form, imageUrl: data.imageUrl });
                    alert('Đã cập nhật ảnh');
                  } else {
                    alert('Upload ảnh thất bại');
                  }
                }}
                className="mt-2"
              />

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleUpdate}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Lưu
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-sm underline"
                >
                  Huỷ
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold">{item.name}</h3>
              <p><strong>Mô tả:</strong> {item.description}</p>
              <p><strong>Nguồn:</strong> {item.source}</p>
              <p><strong>Loại:</strong> {item.category}</p>
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-32 mt-2 rounded object-contain"
                />
              )}
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Chỉnh sửa
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

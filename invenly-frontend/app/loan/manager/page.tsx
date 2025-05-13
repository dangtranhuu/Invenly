'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { withAuthGuard } from '@/lib/withAuthGuard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type LoanItem = {
  _id: string;
  code: string;
  name: string;
  borrowerName: string;
  loanDate: string;
  returnDueDate: string;
};

export default function LoanManagerPage() {
  const router = useRouter();
  const [items, setItems] = useState<LoanItem[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    withAuthGuard(async (token) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/loan/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = new Error('Unauthorized');
        (err as any).status = res.status;
        throw err;
      }

      const data = await res.json();
      setItems(data.items || []);
      setLoading(false);
    }, router, '/login', '/loan/manager'); // 👈 thêm path này để quay lại sau login
  }, [router]);



  const handleReturnItem = async (itemId: string) => {
    const confirmed = confirm('Xác nhận đã nhận lại vật phẩm này?');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('invenly_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/loan/return/${itemId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        setItems((prev) => prev.filter((item) => item._id !== itemId));
      } else {
        alert('❌ Không thể cập nhật trạng thái vật phẩm');
      }
    } catch (err) {
      console.error('Lỗi khi gửi yêu cầu:', err);
      alert('❌ Lỗi hệ thống');
    }
  };

  if (loading) return <p className="p-4">⏳ Đang tải danh sách...</p>;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">📋 Danh sách vật phẩm đang mượn</h2>

      {items.length === 0 ? (
        <p>Không có vật phẩm nào đang được mượn.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên vật phẩm</TableHead>
              <TableHead>Người mượn</TableHead>
              <TableHead>Ngày mượn</TableHead>
              <TableHead>Hạn trả</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell>{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.borrowerName}</TableCell>
                <TableCell>{new Date(item.loanDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(item.returnDueDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="destructive"
                    onClick={() => handleReturnItem(item._id)}
                  >
                    ✅ Đã nhận lại
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

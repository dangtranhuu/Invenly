'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { login } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = await login(username, password);

    if (data?.user?.token) {
      localStorage.setItem('invenly_token', data.user.token);

      const pending = localStorage.getItem('pendingLoanRequest');
      if (pending) {
        const payload = JSON.parse(pending);

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/loan/batch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.user.token}`,
            },
            body: JSON.stringify(payload),
          });

          const result = await res.json();

          if (res.ok) {
            alert(`✅ Gửi lại thành công: ${result.success} vật phẩm\n❌ Thất bại: ${result.failed.join(', ')}`);
          } else {
            alert(`❌ Gửi lại thất bại: ${result.error || 'Lỗi không xác định'}`);
          }

          localStorage.removeItem('pendingLoanRequest');
          router.push('/dashboard'); // hoặc quay về /scan
          return;
        } catch (err) {
          alert('❌ Lỗi khi gửi lại yêu cầu mượn');
          // vẫn tiếp tục login
        }
      }

      // Không có pending loan → login bình thường
      router.push('/dashboard');
    } else {
      setError(data.message || 'Đăng nhập thất bại');
    }

    setLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-4">
          <h1 className="text-2xl font-semibold text-center">Đăng nhập Invenly</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              placeholder="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

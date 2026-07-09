import { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

export function CustomerReview() {
  const [ratings, setRatings] = useState({ food: 5, service: 5, space: 5 });
  const [comment, setComment] = useState('');

  const handleRatingChange = (category: 'food' | 'service' | 'space', value: number) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  const handleSubmit = () => {
    // Payload đẩy về API: POST /customer/review
    toast.success('Cảm ơn ý kiến quý báu đóng góp của bạn!');
  };

  const renderStars = (category: 'food' | 'service' | 'space', currentRating: number) => {
    return (
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(category, star)}
            className="transition-transform active:scale-125"
          >
            <Star className={`w-6 h-6 ${star <= currentRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-black text-slate-800">Đánh giá trải nghiệm</h2>
        <p className="text-xs text-slate-400">Ý kiến của bạn giúp chúng tôi cải thiện chất lượng mỗi ngày</p>
      </div>

      <Card className="border-slate-200/80 shadow-sm rounded-2xl bg-white">
        <CardContent className="p-5 space-y-5">
          
          {/* Tiêu chí 1 */}
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <Label className="text-sm font-bold text-slate-700">Chất lượng món ăn</Label>
            {renderStars('food', ratings.food)}
          </div>

          {/* Tiêu chí 2 */}
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <Label className="text-sm font-bold text-slate-700">Thái độ phục vụ</Label>
            {renderStars('service', ratings.service)}
          </div>

          {/* Tiêu chí 3 */}
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <Label className="text-sm font-bold text-slate-700">Không gian cửa hàng</Label>
            {renderStars('space', ratings.space)}
          </div>

          {/* Nội dung text bình luận bổ sung */}
          <div className="space-y-1.5">
            <Label htmlFor="comment" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ý kiến góp ý thêm</Label>
            <Textarea
              id="comment"
              placeholder="Nhập cảm nhận của bạn tại đây..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="rounded-xl border-slate-200 focus-visible:ring-blue-600 min-h-[90px] text-xs"
            />
          </div>

          <Button onClick={handleSubmit} className="w-full h-11 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white">
            Gửi đánh giá dịch vụ
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
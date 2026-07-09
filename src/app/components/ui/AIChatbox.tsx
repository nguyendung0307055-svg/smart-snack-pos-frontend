import { useState, useEffect, useRef } from 'react';
import { Button } from './button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { ScrollArea } from './scroll-area';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Flame,
  ThumbsUp,
  Loader2,
  Utensils
} from 'lucide-react';
import productService from '../../../services/productService';
// Import dịch vụ gọi API từ file productService của bạn

// Định nghĩa kiểu dữ liệu khớp chính xác với ProductResponse từ Java Backend gửi về
interface ProductResponse {
  id: number;
  name: string;
  description: string;
  image: string;
  price: number;
  status: string;
  bestSeller: boolean;
  categoryId: number;
  categoryName: string;
  sizes?: any[];
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  suggestions?: ProductResponse[]; // Chứa danh sách món ăn thật từ Backend
}

export function AIChatbox() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Lời chào khởi tạo khi khách hàng mở hộp thoại chat
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsAiTyping(true);
      setTimeout(() => {
        setMessages([
          {
            id: 'welcome',
            sender: 'ai',
            text: 'Xin chào! 👋 Mình là Trợ lý AI SmartSnack. Bạn đang phân vân chưa biết chọn món nào ngon hôm nay đúng không? Để mình gợi ý cho bạn nhé!',
            timestamp: new Date()
          }
        ]);
        setIsAiTyping(false);
      }, 600);
    }
  }, [isOpen]);

  // Tự động cuộn khung chat xuống dưới cùng khi có tin nhắn mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiTyping]);

  // HÀM QUAN TRỌNG: Gọi API xuống Java Backend để lấy dữ liệu thực tế
  const getAiRecommendation = async (type: 'BEST_SELLER' | 'TRENDING' | 'NEW' | 'GENERAL') => {
    setIsAiTyping(true);

    let replyText = '';
    let items: ProductResponse[] = [];

    try {
      // Thực hiện gọi hàm Axios bạn vừa thêm vào trong productService
      const data = await productService.getRecommendations(type);
      items = Array.isArray(data) ? data : [];

      // Phân bổ câu thoại phù hợp với từng kịch bản chọn lựa
      switch (type) {
        case 'BEST_SELLER':
          replyText = '🔥 Dạ đây là các siêu phẩm "Best-Seller" bán chạy nhất hệ thống của quán, hương vị cực kỳ vừa miệng luôn ạ:';
          break;
        case 'TRENDING':
          replyText = '✨ Xu hướng gọi món hôm nay! Các bàn xung quanh và cộng đồng đang chọn các món này rất nhiều đó bạn:';
          break;
        case 'NEW':
          replyText = '🆕 Quán em vừa cập nhật thực đơn một số món ăn mới độc quyền, bạn thử qua xem sao nha:';
          break;
        default:
          replyText = '💡 Dưới đây là danh sách những món ăn chất lượng cao được đánh giá 5 sao trên hệ thống của quán:';
          break;
      }
    } catch (error) {
      console.error("Lỗi khi kết nối API Trợ lý AI:", error);
      replyText = '😢 Dạ xin lỗi bạn, đường truyền kết nối dữ liệu món ăn của AI đang gặp chút sự cố nhỏ. Bạn xem tạm danh mục Menu chính giúp em nha!';
      items = [];
    } finally {
      // Ghi nhận phản hồi và render ra màn hình chat công khai
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'ai',
          text: replyText,
          timestamp: new Date(),
          suggestions: items
        }
      ]);
      setIsAiTyping(false);
    }
  };

  // Xử lý sự kiện khi khách hàng tự gõ text vào ô Input
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setMessages(prev => [
      ...prev,
      { id: Math.random().toString(), sender: 'user', text: userText, timestamp: new Date() }
    ]);
    setInputValue('');

    // Bắt keyword chữ thường để phân tích ý định (Intent) của người dùng
    const textLower = userText.toLowerCase();
    if (textLower.includes('bán chạy') || textLower.includes('ngon nhất') || textLower.includes('nhiều người mua')) {
      await getAiRecommendation('BEST_SELLER');
    } else if (textLower.includes('hot') || textLower.includes('trend') || textLower.includes('xu hướng')) {
      await getAiRecommendation('TRENDING');
    } else if (textLower.includes('mới')) {
      await getAiRecommendation('NEW');
    } else {
      await getAiRecommendation('GENERAL');
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 font-sans">
      {/* NÚT BẤM NỔI BẬT ĐỂ MỞ CHATBOX */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-xl flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110 relative group"
        >
          <Bot className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1.5 -right-1 bg-red-500 text-[9px] text-white font-black px-1.5 py-0.5 rounded-full animate-bounce">AI</span>
          <div className="absolute right-16 bg-slate-900 text-white text-[11px] font-bold py-1.5 px-3 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-md">
            ✨ Hôm nay ăn gì? Hỏi AI ngay!
          </div>
        </Button>
      )}

      {/* KHUNG NỘI DUNG GIAO DIỆN CHATBOX (Đã tối ưu dịch lên trên nút) */}
      {isOpen && (
        <Card className="w-[340px] sm:w-[360px] h-[480px] absolute bottom-16 right-0 shadow-2xl border border-slate-100 rounded-2xl flex flex-col overflow-hidden bg-white animate-in slide-in-from-bottom-5 duration-300">

          {/* HEADER CHATBOX */}
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-violet-600 p-3.5 flex flex-row items-center justify-between space-y-0 text-white shadow-sm">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-xl">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-black tracking-wide flex items-center gap-1.5">
                  TRỢ LÝ MÓN NGON AI <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                </CardTitle>
                <p className="text-[10px] text-indigo-100 font-medium">Kết nối trực tiếp dữ liệu nhà hàng</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          {/* VÙNG HIỂN THỊ NỘI DUNG CUỘN TIN NHẮN */}
          <CardContent className="flex-1 p-3 overflow-hidden bg-slate-50">
            <ScrollArea ref={scrollRef} className="h-full pr-1 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} mb-3`}>

                  {/* Bong bóng chữ văn bản */}
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${msg.sender === 'user'
                      ? 'bg-indigo-600 text-white font-semibold rounded-tr-none'
                      : 'bg-white text-slate-800 font-medium border border-slate-100 rounded-tl-none'
                    }`}>
                    {msg.text}
                  </div>

                  {/* THỂ RENDERING DANH SÁCH MÓN ĂN THỰC TẾ */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="w-full mt-2 space-y-2">
                      {msg.suggestions.map((item) => (
                        <div key={item.id} className="bg-white border border-slate-100 rounded-xl p-2 flex gap-2.5 items-center shadow-sm hover:border-indigo-200 transition-all duration-200">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg border border-slate-100 flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">🍲</div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${item.bestSeller
                                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                }`}>
                                {item.bestSeller ? '🔥 Bán Chạy' : item.categoryName || 'Món ngon'}
                              </span>
                            </div>
                            <h5 className="text-xs font-black text-slate-800 truncate mt-1">{item.name}</h5>
                            <div className="flex justify-between items-center mt-0.5">
                              <span className="text-xs font-black text-indigo-600">{item.price?.toLocaleString()}₫</span>
                              {item.sizes && item.sizes.length > 0 && (
                                <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-1 rounded">+{item.sizes.length} Cỡ</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="text-[9px] text-slate-400 font-bold mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {/* LOADER HIỆU ỨNG AI ĐANG PHÂN TÍCH */}
              {isAiTyping && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3 max-w-[110px] shadow-sm">
                  <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                  <span className="text-[10px] text-slate-400 font-black animate-pulse">AI đang lọc...</span>
                </div>
              )}
            </ScrollArea>
          </CardContent>

          {/* HÀNG NÚT GỢI Ý CHỌN NHANH */}
          <div className="bg-slate-50 px-3 pb-2.5 flex flex-wrap gap-1.5">
            <button
              onClick={() => getAiRecommendation('BEST_SELLER')}
              disabled={isAiTyping}
              className="text-[10px] font-black bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-slate-700 hover:text-orange-700 px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 transition-all"
            >
              <Flame className="w-3 h-3 text-orange-500 fill-orange-500" /> Món bán chạy nhất
            </button>
            <button
              onClick={() => getAiRecommendation('TRENDING')}
              disabled={isAiTyping}
              className="text-[10px] font-black bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-700 px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 transition-all"
            >
              <ThumbsUp className="w-3 h-3 text-blue-500 fill-blue-500" /> Xu hướng gọi món
            </button>
            <button
              onClick={() => getAiRecommendation('NEW')}
              disabled={isAiTyping}
              className="text-[10px] font-black bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 transition-all"
            >
              <Utensils className="w-3 h-3 text-emerald-500" /> Các món mới ra mắt
            </button>
          </div>

          {/* KHU VỰC Ô NHẬP TIN NHẮN CHÁT */}
          <CardFooter className="p-2.5 border-t border-slate-100 bg-white">
            <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập câu hỏi hoặc chọn nút gợi ý ở trên..."
                className="flex-1 h-9 rounded-xl text-xs border-slate-200 bg-slate-50/50 focus-visible:ring-indigo-500"
                disabled={isAiTyping}
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0"
                disabled={!inputValue.trim() || isAiTyping}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
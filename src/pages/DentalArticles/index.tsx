import React, { useState } from "react";
import article1 from "@/assets/images/dental_article_1.png";
import article2 from "@/assets/images/dental_article_2.png";
import article3 from "@/assets/images/dental_article_3.png";
import {
  FaBookOpen,
  FaUser,
  FaCalendarAlt,
  FaSearchPlus,
  FaTimes,
} from "react-icons/fa";

interface Article {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  abstract: string;
  image: string;
}

const articlesData: Article[] = [
  {
    id: "1",
    title:
      "Nghiên cứu về cơ chế bảo vệ men răng và ngăn ngừa sâu răng hiệu quả ở trẻ em",
    category: "Nha khoa trẻ em",
    author: "PGS. TS. Nguyễn Văn Minh - Viện Răng Hàm Mặt Quốc Gia",
    date: "15/05/2026",
    abstract:
      "Bài báo trình bày các phân tích chuyên sâu về cấu trúc men răng trẻ em, các yếu tố sinh học ảnh hưởng đến quá trình khử khoáng và tái khoáng hóa. Đồng thời đề xuất các phương pháp can thiệp fluoride nồng độ cao trong môi trường học đường nhằm giảm thiểu tỷ lệ sâu răng hoạt động.",
    image: article1,
  },
  {
    id: "2",
    title:
      "Đánh giá hiệu quả lâm sàng của phương pháp chỉnh nha sớm ứng dụng kỹ thuật lực kéo nhẹ",
    category: "Chỉnh nha & Chấn thương học",
    author: "TS. BS. Lê Thị Thu Thủy - Đại học Y Dược",
    date: "28/04/2026",
    abstract:
      "Nghiên cứu lâm sàng thực hiện trên 150 bệnh nhi có dấu hiệu lệch lạc khớp cắn sớm. Kết quả cho thấy việc sử dụng khí cụ điều chỉnh chức năng kết hợp lực kéo nhẹ giúp định hình xương ổ răng tốt hơn, rút ngắn thời gian điều trị chỉnh nha cố định ở giai đoạn dậy thì và giảm thiểu tiêu chân răng.",
    image: article2,
  },
  {
    id: "3",
    title:
      "Ứng dụng vật liệu sinh học thông minh trong điều trị nha chu nâng cao và tái tạo mô liên kết",
    category: "Nha chu học",
    author:
      "Dr. Catherine Jenkins & Cộng sự - Trung tâm nghiên cứu Nha khoa ASEAN",
    date: "10/06/2026",
    abstract:
      "Tổng quan các xu hướng mới trong sử dụng vật liệu hydrogel tự tiêu và màng sinh học collagen gia cường tế bào gốc để điều trị tổn thương viêm nha chu nặng. Bài báo cung cấp dữ liệu thử nghiệm in-vitro chứng minh tốc độ liền thương và tái tạo xương ổ răng tăng 40% so với phương pháp ghép xương tự thân truyền thống.",
    image: article3,
  },
];

const DentalArticles: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center justify-center rounded-full bg-indigo-100 p-3 text-indigo-600">
          <FaBookOpen className="text-3xl" />
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Tài liệu & Bài viết Khoa học Nha khoa
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-xl text-slate-500">
          Cổng thông tin lưu trữ và chia sẻ các kết quả nghiên cứu y khoa, hướng
          dẫn điều trị chuẩn quốc gia về Nha học đường.
        </p>
        <div className="mt-6 flex justify-center">
          <span className="h-1 w-24 rounded bg-indigo-500"></span>
        </div>
      </div>

      {/* Grid List of Articles */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {articlesData.map((article) => (
          <div
            key={article.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            {/* Image container */}
            <div className="relative h-64 overflow-hidden bg-slate-900">
              <img
                src={article.image}
                alt={article.title}
                className="h-full w-full object-cover object-top opacity-90 transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
              <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                {article.category}
              </span>
              <button
                onClick={() => setSelectedArticle(article)}
                className="absolute bottom-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-indigo-600 shadow transition-all duration-200 hover:bg-indigo-600 hover:text-white"
                title="Phóng to xem bài viết"
              >
                <FaSearchPlus className="text-lg" />
              </button>
            </div>

            {/* Content card */}
            <div className="flex flex-1 flex-col p-6">
              <div className="mb-3 flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <FaUser /> {article.author.split("-")[0].trim()}
                </span>
                <span className="flex items-center gap-1">
                  <FaCalendarAlt /> {article.date}
                </span>
              </div>

              <h2 className="mb-3 line-clamp-2 text-lg font-bold text-slate-800 transition hover:text-indigo-600">
                {article.title}
              </h2>

              <p className="mb-5 line-clamp-4 flex-1 text-sm leading-relaxed text-slate-500">
                {article.abstract}
              </p>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs font-medium text-slate-400">
                  Nguồn:{" "}
                  {article.author.includes("-")
                    ? article.author.split("-")[1].trim()
                    : "Nha học đường"}
                </span>
                <button
                  onClick={() => setSelectedArticle(article)}
                  className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
                >
                  Đọc tóm tắt & Xem bài báo &rarr;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal viewer */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm transition-opacity duration-300">
          <div className="animate-in fade-in zoom-in-95 relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 p-6">
              <div>
                <span className="mb-2 inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
                  {selectedArticle.category}
                </span>
                <h3 className="text-xl font-bold leading-snug text-slate-800 sm:text-2xl">
                  {selectedArticle.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium text-indigo-600">
                    <FaUser /> {selectedArticle.author}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <FaCalendarAlt /> Ngày đăng: {selectedArticle.date}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="cursor-pointer rounded-full p-2 text-slate-400 transition hover:bg-slate-200/50 hover:text-slate-600"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="grid gap-8 lg:grid-cols-12">
                {/* Text abstract */}
                <div className="flex flex-col justify-between lg:col-span-5">
                  <div>
                    <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                      Tóm tắt nghiên cứu (Abstract)
                    </h4>
                    <p className="rounded-xl border border-indigo-100/50 bg-indigo-50/50 p-4 text-justify text-base leading-relaxed text-slate-600">
                      {selectedArticle.abstract}
                    </p>
                  </div>
                  <div className="mt-6 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500">
                    <p>
                      <strong>Từ khóa:</strong> Nha học đường, nha khoa dự
                      phòng, y học chứng cứ, lâm sàng răng hàm mặt.
                    </p>
                    <p>
                      <strong>Bản quyền:</strong> Tài liệu phục vụ mục đích
                      nghiên cứu học tập nội bộ hệ thống Nha học đường Việt Nam.
                    </p>
                  </div>
                </div>

                {/* Article Image container */}
                <div className="flex flex-col items-center lg:col-span-7">
                  <h4 className="mb-2 w-full text-left text-sm font-semibold uppercase tracking-wider text-slate-400">
                    Tài liệu gốc (Hình ảnh)
                  </h4>
                  <div className="group relative flex max-h-[50vh] w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-inner">
                    <img
                      src={selectedArticle.image}
                      alt="Scientific paper detail"
                      className="max-h-[50vh] object-contain"
                    />
                  </div>
                  <span className="mt-2 text-xs italic text-slate-400">
                    Nhấp đúp hoặc cuộn chuột để phóng to thu nhỏ chi tiết ảnh
                    bài viết.
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 p-6">
              <button
                onClick={() => setSelectedArticle(null)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DentalArticles;

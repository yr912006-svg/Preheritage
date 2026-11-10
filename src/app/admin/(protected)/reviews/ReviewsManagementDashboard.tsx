"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  CheckCircle,
  XCircle,
  MessageSquare,
  Search,
  RefreshCw,
  HelpCircle,
  AlertCircle,
  Send,
  Eye,
  EyeOff,
} from "lucide-react";

type ReviewImage = { id: string; url: string };
type ReviewItem = {
  id: string;
  productId: string;
  rating: number;
  title: string | null;
  comment: string;
  verifiedPurchase: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminReply: string | null;
  createdAt: string;
  product: { id: string; title: string; slug: string; images?: { url: string }[] };
  user: { id: string; name: string | null; email: string | null };
  images: ReviewImage[];
};

type QuestionItem = {
  id: string;
  productId: string;
  question: string;
  answer: string | null;
  isPublic: boolean;
  createdAt: string;
  product: { id: string; title: string; slug: string };
  user: { id: string; name: string | null; email: string | null };
};

export default function ReviewsManagementDashboard() {
  const [activeTab, setActiveTab] = useState<"reviews" | "questions">("reviews");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [counts, setCounts] = useState({ pendingReviews: 0, totalReviews: 0, totalQuestions: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("query", searchQuery.trim());

      const res = await fetch(`/api/admin/reviews?${params.toString()}`, { cache: "no-store" });
      let data: any = null;
      if (res.headers.get("content-type")?.includes("application/json")) {
        data = await res.json();
      }
      if (!res.ok) throw new Error(data?.message || "Could not load reviews.");

      setReviews(data.reviews || []);
      setQuestions(data.questions || []);
      if (data.counts) setCounts(data.counts);

      const rDrafts: Record<string, string> = {};
      (data.reviews || []).forEach((r: ReviewItem) => {
        if (r.adminReply) rDrafts[r.id] = r.adminReply;
      });
      setReplyDrafts((prev) => ({ ...rDrafts, ...prev }));

      const aDrafts: Record<string, string> = {};
      (data.questions || []).forEach((q: QuestionItem) => {
        if (q.answer) aDrafts[q.id] = q.answer;
      });
      setAnswerDrafts((prev) => ({ ...aDrafts, ...prev }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleModerateReview = async (reviewId: string, status: "APPROVED" | "REJECTED", replyText?: string) => {
    setBusyId(reviewId);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "moderate-review",
          reviewId,
          status,
          adminReply: replyText !== undefined ? replyText : replyDrafts[reviewId],
        }),
      });
      let data: any = null;
      if (res.headers.get("content-type")?.includes("application/json")) {
        data = await res.json();
      }
      if (!res.ok) throw new Error(data?.message || "Moderation update failed.");

      setNotice(`Review ${status === "APPROVED" ? "approved" : "rejected"} successfully.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Moderation update failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveReply = async (reviewId: string) => {
    setBusyId(reviewId);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "moderate-review",
          reviewId,
          adminReply: replyDrafts[reviewId] || "",
        }),
      });
      let data: any = null;
      if (res.headers.get("content-type")?.includes("application/json")) {
        data = await res.json();
      }
      if (!res.ok) throw new Error(data?.message || "Reply save failed.");

      setNotice("Admin reply saved.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reply save failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleAnswerQuestion = async (questionId: string, isPublic?: boolean) => {
    setBusyId(questionId);
    setError("");
    setNotice("");
    try {
      const body: any = {
        action: "answer-question",
        questionId,
        answer: answerDrafts[questionId] || "",
      };
      if (typeof isPublic === "boolean") body.isPublic = isPublic;

      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let data: any = null;
      if (res.headers.get("content-type")?.includes("application/json")) {
        data = await res.json();
      }
      if (!res.ok) throw new Error(data?.message || "Question update failed.");

      setNotice("Question answer saved.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Question update failed.");
    } finally {
      setBusyId(null);
    }
  };

  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const q = searchQuery.toLowerCase();
    return questions.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.product.title.toLowerCase().includes(q) ||
        (item.user.name && item.user.name.toLowerCase().includes(q))
    );
  }, [questions, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900">Reviews & Q&A Moderation</h1>
          <p className="mt-1 text-xs text-charcoal-500">
            Moderate customer reviews, submit verified atelier replies, and respond to product queries
          </p>
        </div>
        <button
          onClick={() => void loadData()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-2 text-xs font-semibold text-charcoal-700 bg-ivory-50 border border-ivory-300 rounded hover:bg-ivory-100 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Primary Tabs */}
      <div className="flex items-center gap-2 border-b border-ivory-300 pb-2">
        <button
          onClick={() => setActiveTab("reviews")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t transition-colors ${
            activeTab === "reviews"
              ? "bg-gold-500 text-charcoal-950 shadow-sm"
              : "text-charcoal-600 hover:text-charcoal-900 hover:bg-ivory-200/50"
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>Customer Reviews</span>
          {counts.pendingReviews > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-bold">
              {counts.pendingReviews}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("questions")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t transition-colors ${
            activeTab === "questions"
              ? "bg-gold-500 text-charcoal-950 shadow-sm"
              : "text-charcoal-600 hover:text-charcoal-900 hover:bg-ivory-200/50"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Product Q&A</span>
          <span className="text-[10px] text-charcoal-400">({counts.totalQuestions})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-ivory-50 p-3 rounded border border-ivory-300">
        {activeTab === "reviews" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-charcoal-900 text-white"
                    : "bg-ivory-100 text-charcoal-600 hover:bg-ivory-200"
                }`}
              >
                {st === "ALL" ? "All Reviews" : st.charAt(0) + st.slice(1).toLowerCase()}
                {st === "PENDING" && counts.pendingReviews > 0 && (
                  <span className="ml-1 px-1 bg-amber-500 text-charcoal-950 rounded text-[10px]">
                    {counts.pendingReviews}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search comment, product, customer..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-ivory-300 text-xs rounded focus:outline-none focus:border-gold-500"
          />
        </div>
      </div>

      {/* Reviews Content */}
      {activeTab === "reviews" && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-charcoal-500 bg-ivory-50 rounded border border-ivory-300">
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center text-xs text-charcoal-500 bg-ivory-50 rounded border border-ivory-300">
              No reviews found matching the selected filter.
            </div>
          ) : (
            reviews.map((item) => {
              const isBusy = busyId === item.id;
              const productImg = item.product.images?.[0]?.url;

              return (
                <div
                  key={item.id}
                  className="bg-ivory-50 border border-ivory-300 rounded p-4 sm:p-5 space-y-4 shadow-sm hover:border-ivory-400 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {productImg && (
                        <div className="w-12 h-16 relative rounded overflow-hidden shrink-0 bg-ivory-200 border border-ivory-300">
                          <Image
                            src={productImg}
                            alt=""
                            fill
                            unoptimized={productImg.startsWith("/api/storage/")}
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/products/${item.product.slug}`}
                          target="_blank"
                          className="font-serif font-bold text-sm text-charcoal-900 hover:text-gold-700 transition-colors"
                        >
                          {item.product.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= item.rating ? "fill-amber-400 text-amber-400" : "text-ivory-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-charcoal-400">
                            by {item.user.name || item.user.email || "Customer"} ·{" "}
                            {new Date(item.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {item.verifiedPurchase && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          item.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : item.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Review Text */}
                  <div className="text-xs text-charcoal-800 bg-white/70 p-3 rounded border border-ivory-200">
                    {item.title && <div className="font-semibold text-charcoal-900 mb-1">{item.title}</div>}
                    <p className="whitespace-pre-wrap">{item.comment}</p>
                    {item.images.length > 0 && (
                      <div className="flex items-center gap-2 mt-3 overflow-x-auto">
                        {item.images.map((img) => (
                          <div key={img.id} className="w-16 h-16 relative rounded overflow-hidden border border-ivory-300 shrink-0">
                            <Image src={img.url} alt="" fill unoptimized={img.url.startsWith("/api/storage/")} className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons & Admin Reply */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-ivory-200 text-xs">
                    <div className="flex items-center gap-2">
                      {item.status !== "APPROVED" && (
                        <button
                          onClick={() => handleModerateReview(item.id, "APPROVED")}
                          disabled={isBusy}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve Review</span>
                        </button>
                      )}
                      {item.status !== "REJECTED" && (
                        <button
                          onClick={() => handleModerateReview(item.id, "REJECTED")}
                          disabled={isBusy}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject Review</span>
                        </button>
                      )}
                    </div>

                    <div className="flex-1 sm:max-w-md flex items-center gap-2">
                      <input
                        type="text"
                        value={replyDrafts[item.id] || ""}
                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="Atelier official reply..."
                        className="flex-1 px-3 py-1.5 bg-white border border-ivory-300 rounded text-xs focus:outline-none focus:border-gold-500"
                      />
                      <button
                        onClick={() => handleSaveReply(item.id)}
                        disabled={isBusy}
                        className="px-3 py-1.5 bg-charcoal-900 hover:bg-charcoal-800 text-white rounded font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Questions Content */}
      {activeTab === "questions" && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-charcoal-500 bg-ivory-50 rounded border border-ivory-300">
              Loading questions...
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="p-12 text-center text-xs text-charcoal-500 bg-ivory-50 rounded border border-ivory-300">
              No product questions found.
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isBusy = busyId === q.id;

              return (
                <div
                  key={q.id}
                  className="bg-ivory-50 border border-ivory-300 rounded p-4 sm:p-5 space-y-4 shadow-sm hover:border-ivory-400 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/products/${q.product.slug}`}
                        target="_blank"
                        className="font-serif font-bold text-sm text-charcoal-900 hover:text-gold-700 transition-colors"
                      >
                        {q.product.title}
                      </Link>
                      <div className="text-[11px] text-charcoal-400 mt-0.5">
                        Asked by {q.user.name || q.user.email || "Customer"} ·{" "}
                        {new Date(q.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAnswerQuestion(q.id, !q.isPublic)}
                        disabled={isBusy}
                        className={`text-xs px-2.5 py-1 rounded font-semibold flex items-center gap-1 border transition-colors ${
                          q.isPublic
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : "bg-charcoal-100 text-charcoal-700 border-charcoal-300"
                        }`}
                      >
                        {q.isPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{q.isPublic ? "Public" : "Private"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/80 p-3 rounded border border-ivory-200">
                    <div className="text-xs font-semibold text-charcoal-900 mb-1 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-gold-600" />
                      <span>Question:</span>
                    </div>
                    <p className="text-xs text-charcoal-800 whitespace-pre-wrap">{q.question}</p>
                  </div>

                  {/* Answer Input */}
                  <div className="space-y-2 pt-2 border-t border-ivory-200">
                    <label className="text-xs font-semibold text-charcoal-700 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-gold-600" />
                      <span>Atelier Response:</span>
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <textarea
                        rows={2}
                        value={answerDrafts[q.id] || ""}
                        onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="Provide an expert response on weaves, fabric care, dimensions, or styling..."
                        className="flex-1 p-2 bg-white border border-ivory-300 rounded text-xs focus:outline-none focus:border-gold-500"
                      />
                      <button
                        onClick={() => handleAnswerQuestion(q.id)}
                        disabled={isBusy}
                        className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-charcoal-950 font-semibold text-xs rounded transition-colors self-end sm:self-center shadow-gold flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Save Answer</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

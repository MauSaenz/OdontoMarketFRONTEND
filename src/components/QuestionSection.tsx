"use client";

/**
 * Módulo de Preguntas y Respuestas (Estilo Mercado Libre) + Reseñas Clínicas Verificadas
 * (`src/components/QuestionSection.tsx`).
 * Conecta directamente con `interactionService` (`src/services/api.ts`) y `useAuthStore`:
 * 1. Cualquier odontólogo autenticado puede preguntar dudas técnicas sobre lote o caducidad.
 * 2. Si quien visita la página es el Depósito Dental dueño del producto (`isProductOwner`),
 *    se habilita un formulario directo debajo de cada pregunta pendiente para responderla al instante.
 * 3. Muestra y permite publicar Reseñas de 1 a 5 estrellas con insignia de Compra Verificada.
 */

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  CornerDownRight,
  MessageCircleQuestion,
  Send,
  ShieldCheck,
  Star,
} from "lucide-react";
import { extractApiErrorMessage, interactionService } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import type { Question, Review } from "@/types";

interface QuestionSectionProps {
  productId: number;
  productVendorId: number;
  initialQuestions: Question[];
  initialReviews: Review[];
}

export default function QuestionSection({
  productId,
  productVendorId,
  initialQuestions,
  initialReviews,
}: QuestionSectionProps) {
  const { user, isAuthenticated } = useAuthStore();

  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  // Estado para nueva pregunta de odontólogo
  const [newQuestionText, setNewQuestionText] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  // Estado para respuestas del Depósito Dental propietario
  const [answerDrafts, setAnswerDrafts] = useState<Record<number, string>>({});
  const [answeringId, setAnsweringId] = useState<number | null>(null);

  // Estado para nueva reseña clínica
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  // Determina si el usuario actual es el Depósito Dental propietario de este producto
  const isProductOwner =
    Boolean(user?.vendor_profile && user.vendor_profile.id === productVendorId) ||
    user?.role === "admin";

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    setQuestionError(null);
    setSubmittingQuestion(true);

    try {
      const created = await interactionService.askQuestion(
        productId,
        newQuestionText.trim()
      );
      setQuestions([created, ...questions]);
      setNewQuestionText("");
    } catch (err) {
      setQuestionError(extractApiErrorMessage(err));
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleVendorAnswer = async (questionId: number) => {
    const text = answerDrafts[questionId]?.trim();
    if (!text) return;
    setAnsweringId(questionId);
    setQuestionError(null);

    try {
      const updated = await interactionService.answerQuestion(questionId, text);
      setQuestions(
        questions.map((q) => (q.id === questionId ? updated : q))
      );
    } catch (err) {
      setQuestionError(extractApiErrorMessage(err));
    } finally {
      setAnsweringId(null);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccess(null);
    setSubmittingReview(true);

    try {
      const created = await interactionService.createReview(productId, {
        rating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });
      setReviews([created, ...reviews]);
      setReviewTitle("");
      setReviewComment("");
      setReviewSuccess(
        created.is_verified_purchase
          ? "¡Reseña publicada con insignia de Compra Verificada!"
          : "¡Gracias! Tu reseña ha sido publicada."
      );
    } catch (err) {
      setReviewError(extractApiErrorMessage(err));
    } finally {
      setSubmittingReview(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "5.0";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
      {/* =====================================================================
          COLUMNA IZQUIERDA (7 cols): PREGUNTAS Y RESPUESTAS ESTILO MERCADO LIBRE
         ===================================================================== */}
      <section className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-dental-50 text-dental-600 flex items-center justify-center">
              <MessageCircleQuestion className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Preguntas y Respuestas al Depósito Dental
              </h2>
              <p className="text-xs text-slate-500">
                Consulta lote exacto, caducidad, facturación o compatibilidad clínica
              </p>
            </div>
          </div>
          <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
            {questions.length} {questions.length === 1 ? "pregunta" : "preguntas"}
          </span>
        </div>

        {questionError && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{questionError}</span>
          </div>
        )}

        {/* Formulario para hacer una pregunta */}
        {isAuthenticated ? (
          isProductOwner ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl text-xs font-medium">
              🏢 Estás viendo esta publicación como el <strong>Depósito Dental propietario</strong>. Puedes responder las preguntas pendientes de los odontólogos aquí abajo.
            </div>
          ) : (
            <form onSubmit={handleAskQuestion} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                required
                minLength={5}
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Escribe tu pregunta para el Depósito Dental (ej. ¿Qué caducidad tiene el lote actual?)..."
                className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-dental-500"
              />
              <button
                type="submit"
                disabled={submittingQuestion}
                className="inline-flex items-center justify-center gap-2 bg-dental-600 hover:bg-dental-700 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-sm transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>{submittingQuestion ? "Enviando..." : "Preguntar"}</span>
              </button>
            </form>
          )
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <p className="text-xs text-slate-600">
              Inicia sesión con tu cuenta de Odontólogo para hacerle preguntas al Depósito Dental.
            </p>
            <Link
              href="/login"
              className="bg-dental-600 hover:bg-dental-700 text-white font-bold px-4 py-2 rounded-xl text-xs shrink-0"
            >
              Iniciar Sesión
            </Link>
          </div>
        )}

        {/* Lista de Preguntas y Respuestas */}
        <div className="space-y-4">
          {questions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              Aún no hay preguntas en este insumo dental. ¡Sé el primero en preguntar!
            </p>
          ) : (
            questions.map((q) => (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-2.5"
              >
                {/* Pregunta del Odontólogo */}
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">
                    “{q.question_text}”
                  </p>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(q.created_at).toLocaleDateString("es-MX")}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Por{" "}
                  <strong className="text-slate-700">
                    {q.user?.full_name || "Odontólogo"}
                  </strong>
                  {q.user?.clinic_name ? ` (${q.user.clinic_name})` : ""}
                </p>

                {/* Respuesta del Depósito Dental */}
                {q.is_answered && q.answer_text ? (
                  <div className="ml-3 pl-3 border-l-2 border-dental-500 bg-white p-3 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-dental-700">
                      <CornerDownRight className="w-3.5 h-3.5" />
                      <span>Respuesta oficial del Depósito Dental:</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {q.answer_text}
                    </p>
                  </div>
                ) : isProductOwner ? (
                  <div className="pt-2 flex gap-2">
                    <input
                      type="text"
                      value={answerDrafts[q.id] || ""}
                      onChange={(e) =>
                        setAnswerDrafts({
                          ...answerDrafts,
                          [q.id]: e.target.value,
                        })
                      }
                      placeholder="Escribe la respuesta oficial de tu Depósito Dental..."
                      className="flex-1 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs"
                    />
                    <button
                      type="button"
                      disabled={answeringId === q.id}
                      onClick={() => handleVendorAnswer(q.id)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs"
                    >
                      {answeringId === q.id ? "Guardando..." : "Responder"}
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] italic text-amber-700">
                    ⏳ Pendiente de respuesta por parte del Depósito Dental.
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* =====================================================================
          COLUMNA DERECHA (5 cols): RESEÑAS Y CALIFICACIONES VERIFICADAS
         ===================================================================== */}
      <section className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Opiniones Clínicas
            </h2>
            <p className="text-xs text-slate-500">
              Calificaciones de odontólogos y clínicas
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-extrabold text-sm text-slate-900">
              {avgRating}
            </span>
            <span className="text-[11px] text-slate-500">
              ({reviews.length})
            </span>
          </div>
        </div>

        {/* Formulario para escribir reseña */}
        {isAuthenticated && !isProductOwner && (
          <form
            onSubmit={handleCreateReview}
            className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3"
          >
            <p className="text-xs font-bold text-slate-800">
              Calificar este insumo dental
            </p>

            {reviewError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200">
                {reviewError}
              </p>
            )}
            {reviewSuccess && (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{reviewSuccess}</span>
              </p>
            )}

            {/* Selector interactivo de 1 a 5 estrellas */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <button
                  key={starValue}
                  type="button"
                  onClick={() => setRating(starValue)}
                  className="p-1"
                >
                  <Star
                    className={`w-5 h-5 ${
                      starValue <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-600 ml-2">
                {rating} de 5 estrellas
              </span>
            </div>

            <input
              type="text"
              required
              minLength={3}
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="Título de tu opinión (ej. Excelente pulido y lote vigente)"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
            />

            <textarea
              rows={2}
              required
              minLength={5}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Comparte tu experiencia clínica con este material o equipo..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
            />

            <button
              type="submit"
              disabled={submittingReview}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
            >
              {submittingReview ? "Publicando..." : "Publicar Calificación"}
            </button>
          </form>
        )}

        {/* Listado de Reseñas */}
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              Este producto aún no tiene reseñas registradas.
            </p>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl border border-slate-200 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  {rev.is_verified_purchase && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      Compra Verificada
                    </span>
                  )}
                </div>

                <p className="text-xs font-extrabold text-slate-900">
                  {rev.title}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {rev.comment}
                </p>
                <p className="text-[11px] text-slate-400">
                  Por{" "}
                  <strong className="text-slate-600">
                    {rev.user?.full_name || "Odontólogo"}
                  </strong>{" "}
                  • {new Date(rev.created_at).toLocaleDateString("es-MX")}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

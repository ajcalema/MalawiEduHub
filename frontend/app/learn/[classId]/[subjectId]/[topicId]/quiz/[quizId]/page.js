'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { lessonsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import {
  ChevronLeft, Clock, Check, X, AlertCircle, Award,
  RotateCcw, ArrowRight, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function QuizPage() {
  const { quizId } = useParams()
  const { user } = useAuth()
  const router = useRouter()

  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(null)
  const [timerActive, setTimerActive] = useState(false)

  useEffect(() => {
    // Wait for auth to finish loading
    if (user === undefined) return
    if (user === null) {
      router.push('/auth/login')
      return
    }
    loadQuiz()
  }, [quizId, user])

  // Timer countdown
  useEffect(() => {
    if (!timerActive || timeLeft === null || timeLeft <= 0) return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timerActive, timeLeft])

  const loadQuiz = async () => {
    try {
      const { data } = await lessonsApi.getQuiz(quizId)
      setQuiz(data.quiz)
      setQuestions(data.questions || [])
      
      // Initialize timer if time limit exists
      if (data.quiz.time_limit_minutes) {
        setTimeLeft(data.quiz.time_limit_minutes * 60) // Convert to seconds
        setTimerActive(true)
      }
    } catch (err) {
      console.error('Failed to load quiz:', err)
      toast.error('Failed to load quiz.')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoSubmit = async () => {
    toast.error('Time is up! Submitting your quiz...')
    await handleSubmit()
  }

  const handleSubmit = async () => {
    // Check if all questions answered
    const unanswered = questions.filter(q => !answers[q.id])
    if (unanswered.length > 0) {
      const confirmed = confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)
      if (!confirmed) return
    }

    setSubmitting(true)
    try {
      // Format answers for submission
      const formattedAnswers = questions.map(q => ({
        question_id: q.id,
        answer_text: answers[q.id] || ''
      }))

      const { data } = await lessonsApi.submitQuiz(quizId, {
        answers: formattedAnswers
      })

      setResult(data)
      toast.success(data.passed ? 'Congratulations! You passed! 🎉' : 'Keep studying and try again!')
    } catch (err) {
      console.error('Failed to submit quiz:', err)
      toast.error(err?.response?.data?.error || 'Failed to submit quiz.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    if (timeLeft === null) return 'text-gray-600'
    if (timeLeft < 60) return 'text-red-600 animate-pulse'
    if (timeLeft < 180) return 'text-orange-600'
    return 'text-green-600'
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navbar />
        <Loader2 size={32} className="text-purple-500 animate-spin" />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 pt-28 text-center">
          <p className="text-gray-500">Quiz not found.</p>
          <button onClick={() => router.back()} className="text-purple-600 text-sm hover:underline mt-2">
            ← Go Back
          </button>
        </div>
      </div>
    )
  }

  // Show results
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
          {/* Back button */}
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all group shadow-sm mb-6">
            <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Topic</span>
          </button>

          {/* Results Card */}
          <div className={`rounded-2xl border-2 p-8 mb-6 ${
            result.passed 
              ? 'bg-green-50 border-green-200' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="text-center mb-6">
              <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                result.passed ? 'bg-green-500' : 'bg-orange-500'
              }`}>
                {result.passed ? (
                  <Award size={40} className="text-white" />
                ) : (
                  <AlertCircle size={40} className="text-white" />
                )}
              </div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
                {result.passed ? 'Congratulations!' : 'Keep Practicing!'}
              </h1>
              <p className="text-sm text-gray-600">
                {result.passed 
                  ? `You passed with ${result.score}%!` 
                  : `You scored ${result.score}%. Passing score is ${result.passing_score}%.`}
              </p>
            </div>

            {/* Score Details */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{result.score}%</p>
                <p className="text-xs text-gray-500 mt-1">Your Score</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{result.earned_points}/{result.total_points}</p>
                <p className="text-xs text-gray-500 mt-1">Points Earned</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{result.passing_score}%</p>
                <p className="text-xs text-gray-500 mt-1">Passing Score</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setResult(null)
                  setAnswers({})
                  if (quiz?.time_limit_minutes) {
                    setTimeLeft(quiz.time_limit_minutes * 60)
                    setTimerActive(true)
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-purple-700 
                  bg-white border-2 border-purple-200 rounded-xl hover:bg-purple-50 transition-all">
                <RotateCcw size={16} />
                Try Again
              </button>
              <button 
                onClick={() => router.back()}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white 
                  bg-purple-500 rounded-xl hover:bg-purple-400 transition-all">
                <ArrowRight size={16} />
                Back to Topic
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Quiz taking interface
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all group shadow-sm">
            <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Topic</span>
          </button>
        </div>

        {/* Quiz Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-sm text-gray-600 mb-3">{quiz.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <AlertCircle size={12} />
                  {questions.length} questions
                </span>
                <span>Pass: {quiz.passing_score}%</span>
              </div>
            </div>
            
            {/* Timer */}
            {timeLeft !== null && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 ${
                timeLeft < 60 
                  ? 'bg-red-50 border-red-200' 
                  : timeLeft < 180 
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-green-50 border-green-200'
              }`}>
                <Clock size={18} className={getTimerColor()} />
                <span className={`text-xl font-bold ${getTimerColor()}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, idx) => (
            <div key={question.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              {/* Question Header */}
              <div className="flex items-start gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900 mb-2">{question.question}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="capitalize">{question.question_type.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{question.points} point{question.points !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Multiple Choice */}
              {question.question_type === 'multiple_choice' && question.answers && (
                <div className="ml-11 space-y-2">
                  {question.answers.map(answer => (
                    <label
                      key={answer.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        answers[question.id] === answer.answer_text
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={answer.answer_text}
                        checked={answers[question.id] === answer.answer_text}
                        onChange={() => handleAnswer(question.id, answer.answer_text)}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="text-sm text-gray-700">{answer.answer_text}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* True/False */}
              {question.question_type === 'true_false' && (
                <div className="ml-11 grid grid-cols-2 gap-3">
                  {['True', 'False'].map(option => (
                    <label
                      key={option}
                      className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        answers[question.id] === option
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={() => handleAnswer(question.id, option)}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="text-sm font-medium text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Short Answer */}
              {question.question_type === 'short_answer' && (
                <div className="ml-11">
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                    placeholder="Type your answer here..."
                    rows={3}
                    className="w-full px-4 py-3 text-sm rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {Object.keys(answers).length} of {questions.length} answered
              </p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                />
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length === 0}
              className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white 
                bg-purple-500 rounded-xl hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed 
                transition-all hover:-translate-y-0.5"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Quiz
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

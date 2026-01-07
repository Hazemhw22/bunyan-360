'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import Input from '@/components/shared/Input'
import Button from '@/components/shared/Button'
import Label from '@/components/shared/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/Card'
import Tabs, { TabsContent, TabsList, TabsTrigger } from '@/components/shared/Tabs'
import { createNotification } from '@/lib/notifications'
import { Building2, Mail, Lock, Loader2, User } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        router.push('/dashboard')
      }
      setCheckingAuth(false)
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        router.push('/dashboard')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const validateLoginInputs = () => {
    if (!email || !email.includes('@')) {
      return false
    }
    if (!password || password.length < 6) {
      return false
    }
    return true
  }

  const validateSignupInputs = () => {
    if (!username || username.length < 3) {
      return false
    }
    if (!email || !email.includes('@')) {
      return false
    }
    if (!password || password.length < 6) {
      return false
    }
    if (password !== confirmPassword) {
      return false
    }
    return true
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateLoginInputs()) {
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        let message = 'حدث خطأ أثناء تسجيل الدخول'
        if (error.message.includes('Invalid login credentials')) {
          message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        }
        await createNotification({
          title: 'خطأ',
          message,
          type: 'error',
        })
      } else if (data.session) {
        await createNotification({
          title: 'مرحباً بك!',
          message: 'تم تسجيل الدخول بنجاح. أهلاً بك في نظام بنيان 360',
          type: 'success',
          link: '/dashboard',
        })
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      await createNotification({
        title: 'خطأ',
        message: error.message || 'حدث خطأ أثناء تسجيل الدخول',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateSignupInputs()) {
      await createNotification({
        title: 'خطأ في البيانات',
        message: 'يرجى التحقق من صحة البيانات المدخلة',
        type: 'error',
      })
      return
    }

    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            username: username.trim(),
          },
        },
      })

      if (authError) {
        let message = 'حدث خطأ أثناء إنشاء الحساب'
        if (authError.message.includes('already registered')) {
          message = 'هذا البريد الإلكتروني مسجل بالفعل'
        }
        await createNotification({
          title: 'خطأ',
          message,
          type: 'error',
        })
      } else if (authData.user) {
        // Create profile in profiles table
        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: authData.user.id,
          username: username.trim(),
          email: email.trim(),
          role: 'admin', // Default role
        } as never)

        if (profileError) {
          console.error('Error creating profile:', profileError)
        }

        await createNotification({
          title: 'تم إنشاء الحساب',
          message: 'تم إنشاء حسابك بنجاح',
          type: 'success',
        })

        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      await createNotification({
        title: 'خطأ',
        message: error.message || 'حدث خطأ أثناء إنشاء الحساب',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4 transition-colors">
      <Card className="w-full max-w-md shadow-xl border-gray-200 dark:border-gray-700">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
            <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">نظام إدارة المشاريع</CardTitle>
            <CardDescription className="mt-2">مرحباً بك، قم بتسجيل الدخول للمتابعة</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="login" className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">
                تسجيل الدخول
              </TabsTrigger>
              <TabsTrigger value="signup">
                حساب جديد
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    'تسجيل الدخول'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">اسم المستخدم</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="أدخل اسم المستخدم"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pr-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="6 أحرف على الأقل"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="أعد كتابة كلمة المرور"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري إنشاء الحساب...
                    </>
                  ) : (
                    'إنشاء حساب جديد'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

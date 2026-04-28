'use client'
// Login tabs — parent tab (email+password) and child tab (username+password)
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ParentLoginForm } from './ParentLoginForm'
import { ChildLoginForm } from './ChildLoginForm'
import { ru } from '@/i18n/ru'

const { auth: t } = ru

export function LoginTabs() {
  return (
    <Tabs defaultValue="parent" className="w-full">
      <TabsList className="w-full mb-6">
        <TabsTrigger value="parent" className="flex-1">
          {t.tabParent}
        </TabsTrigger>
        <TabsTrigger value="child" className="flex-1">
          {t.tabChild}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="parent">
        <ParentLoginForm />
      </TabsContent>

      <TabsContent value="child">
        <ChildLoginForm />
      </TabsContent>
    </Tabs>
  )
}

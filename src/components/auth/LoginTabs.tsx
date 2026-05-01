'use client'
// Login tabs — parent, child, and relative tabs.
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ParentLoginForm } from './ParentLoginForm'
import { ChildLoginForm } from './ChildLoginForm'
import { RelativeLoginForm } from './RelativeLoginForm'
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
        <TabsTrigger value="relative" className="flex-1">
          {t.tabRelative}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="parent">
        <ParentLoginForm />
      </TabsContent>

      <TabsContent value="child">
        <ChildLoginForm />
      </TabsContent>

      <TabsContent value="relative">
        <RelativeLoginForm />
      </TabsContent>
    </Tabs>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import {
  CogIcon,
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon,
  CreditCardIcon,
  CircleStackIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface SettingsData {
  general: {
    siteName: string
    siteDescription: string
    contactEmail: string
    supportPhone: string
    timezone: string
    dateFormat: string
  }
  security: {
    passwordMinLength: number
    requireTwoFactor: boolean
    sessionTimeout: number
    maxLoginAttempts: number
    enableAuditLog: boolean
  }
  notifications: {
    emailNotifications: boolean
    smsNotifications: boolean
    adminAlerts: boolean
    userRegistrationAlerts: boolean
    paymentAlerts: boolean
  }
  integrations: {
    stripeEnabled: boolean
    stripePublishableKey: string
    groqEnabled: boolean
    groqApiKey: string
    pineconeEnabled: boolean
    pineconeApiKey: string
  }
  system: {
    maintenanceMode: boolean
    debugMode: boolean
    logLevel: string
    backupFrequency: string
    maxFileSize: number
  }
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [showSecrets, setShowSecrets] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      redirect('/auth/signin')
    }

    fetchSettings()
  }, [session, status])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (section: keyof SettingsData, data: any) => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ section, data })
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      toast.success('Settings saved successfully')
      await fetchSettings() // Refresh settings
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (section: keyof SettingsData, field: string, value: any) => {
    if (!settings) return

    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    })
  }

  const handleSaveSection = (section: keyof SettingsData) => {
    if (!settings) return
    saveSettings(section, settings[section])
  }

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'integrations', name: 'Integrations', icon: GlobeAltIcon },
    { id: 'system', name: 'System', icon: CircleStackIcon }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No settings available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Manage platform configuration and preferences
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {showSecrets ? (
                    <>
                      <EyeSlashIcon className="h-4 w-4 mr-2" />
                      Hide Secrets
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Show Secrets
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Site Name</label>
                    <input
                      type="text"
                      value={settings.general.siteName}
                      onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                    <input
                      type="email"
                      value={settings.general.contactEmail}
                      onChange={(e) => handleInputChange('general', 'contactEmail', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Support Phone</label>
                    <input
                      type="text"
                      value={settings.general.supportPhone}
                      onChange={(e) => handleInputChange('general', 'supportPhone', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Timezone</label>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Site Description</label>
                  <textarea
                    value={settings.general.siteDescription}
                    onChange={(e) => handleInputChange('general', 'siteDescription', e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleSaveSection('general')}
                    disabled={saving}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save General Settings'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Minimum Password Length</label>
                    <input
                      type="number"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => handleInputChange('security', 'passwordMinLength', parseInt(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Login Attempts</label>
                    <input
                      type="number"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.security.requireTwoFactor}
                      onChange={(e) => handleInputChange('security', 'requireTwoFactor', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Require Two-Factor Authentication</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.security.enableAuditLog}
                      onChange={(e) => handleInputChange('security', 'enableAuditLog', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Enable Audit Logging</label>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleSaveSection('security')}
                    disabled={saving}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Security Settings'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.emailNotifications}
                      onChange={(e) => handleInputChange('notifications', 'emailNotifications', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Enable Email Notifications</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.smsNotifications}
                      onChange={(e) => handleInputChange('notifications', 'smsNotifications', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Enable SMS Notifications</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.adminAlerts}
                      onChange={(e) => handleInputChange('notifications', 'adminAlerts', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Admin Alert Notifications</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.userRegistrationAlerts}
                      onChange={(e) => handleInputChange('notifications', 'userRegistrationAlerts', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">User Registration Alerts</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications.paymentAlerts}
                      onChange={(e) => handleInputChange('notifications', 'paymentAlerts', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Payment Alerts</label>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleSaveSection('notifications')}
                    disabled={saving}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Notification Settings'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Integration Settings</h3>
                <div className="space-y-6">
                  {/* Stripe Settings */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <CreditCardIcon className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="text-md font-medium text-gray-900">Stripe Payment Gateway</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.integrations.stripeEnabled}
                          onChange={(e) => handleInputChange('integrations', 'stripeEnabled', e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">Enable Stripe Payments</label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Publishable Key</label>
                        <input
                          type={showSecrets ? 'text' : 'password'}
                          value={settings.integrations.stripePublishableKey}
                          onChange={(e) => handleInputChange('integrations', 'stripePublishableKey', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Groq Settings */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <KeyIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="text-md font-medium text-gray-900">Groq AI Integration</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.integrations.groqEnabled}
                          onChange={(e) => handleInputChange('integrations', 'groqEnabled', e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">Enable Groq AI</label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">API Key</label>
                        <input
                          type={showSecrets ? 'text' : 'password'}
                          value={settings.integrations.groqApiKey}
                          onChange={(e) => handleInputChange('integrations', 'groqApiKey', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pinecone Settings */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <CircleStackIcon className="h-5 w-5 text-purple-600 mr-2" />
                      <h4 className="text-md font-medium text-gray-900">Pinecone Vector Database</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.integrations.pineconeEnabled}
                          onChange={(e) => handleInputChange('integrations', 'pineconeEnabled', e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">Enable Pinecone</label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">API Key</label>
                        <input
                          type={showSecrets ? 'text' : 'password'}
                          value={settings.integrations.pineconeApiKey}
                          onChange={(e) => handleInputChange('integrations', 'pineconeApiKey', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleSaveSection('integrations')}
                    disabled={saving}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Integration Settings'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Log Level</label>
                    <select
                      value={settings.system.logLevel}
                      onChange={(e) => handleInputChange('system', 'logLevel', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="error">Error</option>
                      <option value="warn">Warning</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Backup Frequency</label>
                    <select
                      value={settings.system.backupFrequency}
                      onChange={(e) => handleInputChange('system', 'backupFrequency', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max File Size (MB)</label>
                    <input
                      type="number"
                      value={settings.system.maxFileSize}
                      onChange={(e) => handleInputChange('system', 'maxFileSize', parseInt(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.system.maintenanceMode}
                      onChange={(e) => handleInputChange('system', 'maintenanceMode', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Maintenance Mode</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.system.debugMode}
                      onChange={(e) => handleInputChange('system', 'debugMode', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Debug Mode</label>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleSaveSection('system')}
                    disabled={saving}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save System Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

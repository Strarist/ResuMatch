"use client";

import { useAuth } from "@/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Shield, Globe, Palette, Database } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();

  const handleSettingChange = (setting: string) => {
    toast.info(`${setting} setting updated`);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-600">
            Customize your ResuMatch experience
          </p>
        </div>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive updates about your resume analysis</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSettingChange('Email notifications')}
              >
                Enable
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Analysis Reminders</p>
                <p className="text-sm text-gray-600">Get reminded to analyze new job postings</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSettingChange('Analysis reminders')}
              >
                Enable
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Data Sharing</p>
                <p className="text-sm text-gray-600">Allow anonymous usage data for improvements</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSettingChange('Data sharing')}
              >
                Disable
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-logout</p>
                <p className="text-sm text-gray-600">Automatically log out after 30 minutes of inactivity</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSettingChange('Auto-logout')}
              >
                Enable
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-gray-600">Choose your preferred color scheme</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSettingChange('Light theme')}
                >
                  Light
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSettingChange('Dark theme')}
                >
                  Dark
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-gray-600">Download all your resume data</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSettingChange('Data export')}
              >
                Export
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Clear All Data</p>
                <p className="text-sm text-gray-600">Permanently delete all your data</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleSettingChange('Data deletion')}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Account Type</p>
                <p className="text-sm text-gray-600">Your current subscription plan</p>
              </div>
              <Badge variant="secondary">Free</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Member Since</p>
                <p className="text-sm text-gray-600">When you joined ResuMatch</p>
              </div>
              <span className="text-sm text-gray-600">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
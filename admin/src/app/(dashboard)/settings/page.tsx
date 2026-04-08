"use client";

import { useState } from "react";
import { useTheme } from "@/components/shared/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Lock,
  Bell,
  Palette,
  Globe,
  Shield,
  LogOut,
  Camera,
  Moon,
  Sun,
  Laptop,
} from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
    }, 1000);
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Action Restricted",
      description: "Account deletion is disabled in this demo environment.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0061FF]">
          Preferences
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:w-auto md:grid-cols-4">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Lock className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile details and public information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-sm"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-lg font-medium">Profile Picture</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    JPG, GIF or PNG. Max size of 800K.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" defaultValue="Sandesh" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" defaultValue="Thapa" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  defaultValue="sandeshthapa2028@gmail.com"
                  disabled
                />
                <p className="text-xs text-slate-500">
                  Contact support to change your email address.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" defaultValue="Product Designer & Developer" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>
                Manage your password and security settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <Button onClick={handleSave} disabled={isLoading}>
                Update Password
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label className="text-base">Two-factor authentication</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Secure your account with 2FA.
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-100 dark:border-red-900/50">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Permanently delete your account and all data.
                  </p>
                </div>
                <Button variant="destructive" onClick={handleDeleteAccount}>Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Preferences</CardTitle>
              <CardDescription>
                Customize the look and feel of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  theme === "light"
                    ? "border-[#0061FF] bg-slate-50 dark:bg-slate-800"
                    : "border-slate-200 dark:border-slate-800"
                }`}
                onClick={() => setTheme("light")}
              >
                <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-200">
                  <Sun className="h-8 w-8 text-amber-500" />
                </div>
                <div className="text-center font-medium">Light</div>
              </div>
              <div
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  theme === "dark"
                    ? "border-[#0061FF] bg-slate-50 dark:bg-slate-800"
                    : "border-slate-200 dark:border-slate-800"
                }`}
                onClick={() => setTheme("dark")}
              >
                <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-slate-950 shadow-sm border border-slate-800">
                  <Moon className="h-8 w-8 text-indigo-400" />
                </div>
                <div className="text-center font-medium">Dark</div>
              </div>
              <div
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  theme === "system"
                    ? "border-[#0061FF] bg-slate-50 dark:bg-slate-800"
                    : "border-slate-200 dark:border-slate-800"
                }`}
                onClick={() => setTheme("system")}
              >
                <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-slate-100 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                  <Laptop className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="text-center font-medium">System</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose what emails you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="marketing-emails" className="flex flex-col space-y-1">
                  <span>Marketing emails</span>
                  <span className="font-normal text-slate-500 dark:text-slate-400">
                    Receive emails about new products, features, and more.
                  </span>
                </Label>
                <Switch id="marketing-emails" />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="social-emails" className="flex flex-col space-y-1">
                  <span>Social emails</span>
                  <span className="font-normal text-slate-500 dark:text-slate-400">
                    Receive emails for friend requests, follows, and more.
                  </span>
                </Label>
                <Switch id="social-emails" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="security-emails" className="flex flex-col space-y-1">
                  <span>Security emails</span>
                  <span className="font-normal text-slate-500 dark:text-slate-400">
                    Receive emails about your account security.
                  </span>
                </Label>
                <Switch id="security-emails" defaultChecked disabled />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>
                Choose what push notifications you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="new-orders" className="flex flex-col space-y-1">
                  <span>New Orders</span>
                  <span className="font-normal text-slate-500 dark:text-slate-400">
                    Get notified when a new order is placed.
                  </span>
                </Label>
                <Switch id="new-orders" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="order-updates" className="flex flex-col space-y-1">
                  <span>Order Updates</span>
                  <span className="font-normal text-slate-500 dark:text-slate-400">
                    Get notified when an order status changes.
                  </span>
                </Label>
                <Switch id="order-updates" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Zap, DollarSign, AlertCircle, Loader2, ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const DEVOPS_ENDPOINTS = {
  userEvent: 'https://preview-sandbox--08aa848c2c6112c212d7b47df9e77830.base44.app/api/functions/reportUserEvent',
  revenue: 'https://preview-sandbox--08aa848c2c6112c212d7b47df9e77830.base44.app/api/functions/reportRevenueEvent',
  error: 'https://preview-sandbox--08aa848c2c6112c212d7b47df9e77830.base44.app/api/functions/reportAppError'
};

const APP_ID = 'the-backrooms';

export default function DevOpsTest() {
  const [loading, setLoading] = useState({
    userEvent: false,
    revenue: false,
    error: false
  });

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: player } = useQuery({
    queryKey: ['player', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return null;
      const players = await base44.entities.Player.filter({ created_by: currentUser.email });
      return players[0] || null;
    },
    enabled: !!currentUser,
  });

  const isAdmin = player?.is_admin || currentUser?.role === 'admin';

  const sendUserEventTest = async () => {
    setLoading(prev => ({ ...prev, userEvent: true }));
    try {
      const response = await fetch(DEVOPS_ENDPOINTS.userEvent, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: 'The Backrooms',
          app_id: APP_ID,
          event_type: 'test_user_activity',
          user_email: 'test@example.com',
          metadata: {
            player_id: 'test-player-123',
            game_start_date: new Date().toISOString(),
            test_timestamp: Date.now()
          }
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('✅ User Event Test Sent', {
          description: 'Test user activity reported to DevOps'
        });
      } else {
        throw new Error(data.error || 'Failed to send');
      }
    } catch (error) {
      toast.error('❌ User Event Test Failed', {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, userEvent: false }));
    }
  };

  const sendRevenueTest = async () => {
    setLoading(prev => ({ ...prev, revenue: true }));
    try {
      const response = await fetch(DEVOPS_ENDPOINTS.revenue, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: 'The Backrooms',
          app_id: APP_ID,
          amount: 99.99,
          currency: 'USD',
          category: 'in_app_purchases',
          customer_email: 'test@example.com',
          stream_name: 'Test Premium Pack',
          metadata: {
            item_purchased: 'Test Premium Pack',
            item_id: 'test-pack-001',
            test_timestamp: Date.now()
          }
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('✅ Revenue Test Sent', {
          description: '$99.99 test transaction reported to DevOps'
        });
      } else {
        throw new Error(data.error || 'Failed to send');
      }
    } catch (error) {
      toast.error('❌ Revenue Test Failed', {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, revenue: false }));
    }
  };

  const sendErrorTest = async () => {
    setLoading(prev => ({ ...prev, error: true }));
    try {
      const response = await fetch(DEVOPS_ENDPOINTS.error, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: 'The Backrooms',
          app_id: APP_ID,
          error_message: 'Test critical error: Game state corrupted',
          error_stack: 'Error: Test critical error\n    at testFunction (game.js:123)\n    at GameEngine.run (engine.js:456)',
          severity: 'critical',
          user_affected: 'test@example.com',
          metadata: {
            current_level: 'test-level-5',
            game_state: 'corrupted',
            test_timestamp: Date.now()
          }
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('✅ Error Test Sent', {
          description: 'Test critical error reported to DevOps'
        });
      } else {
        throw new Error(data.error || 'Failed to send');
      }
    } catch (error) {
      toast.error('❌ Error Test Failed', {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, error: false }));
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900/50 border-slate-700/50 max-w-md">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400 mb-6">This page is only accessible to administrators.</p>
            <Link to={createPageUrl('GameGallery')}>
              <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                Return to Games
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('Admin')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Zap className="w-8 h-8 text-cyan-500" />
              DevOps Integration Test
            </h1>
            <p className="text-slate-400">Send test events to DevOps Dashboard</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-8">
          <div className="flex gap-3">
            <Zap className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-cyan-200">
              <p className="font-semibold mb-1">Testing DevOps Integration</p>
              <p className="text-cyan-300/80">
                These buttons send test data to the DevOps dashboard. Use them to verify the integration is working correctly.
              </p>
              <p className="text-cyan-400 text-xs mt-2 font-mono">
                App ID: {APP_ID}
              </p>
            </div>
          </div>
        </div>

        {/* Test Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* User Event Test */}
          <Card className="bg-slate-900/50 border-slate-700/50 hover:border-purple-500/30 transition-all">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <CardTitle className="text-white">User Event</CardTitle>
              <CardDescription className="text-slate-400">
                Test user registration/activity tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={sendUserEventTest}
                disabled={loading.userEvent}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white"
              >
                {loading.userEvent ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send User Event Test'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Revenue Test */}
          <Card className="bg-slate-900/50 border-slate-700/50 hover:border-green-500/30 transition-all">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <CardTitle className="text-white">Revenue Event</CardTitle>
              <CardDescription className="text-slate-400">
                Test $99.99 transaction reporting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={sendRevenueTest}
                disabled={loading.revenue}
                className="w-full bg-green-500 hover:bg-green-600 text-black font-bold"
              >
                {loading.revenue ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Revenue Test'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Error Test */}
          <Card className="bg-slate-900/50 border-slate-700/50 hover:border-red-500/30 transition-all">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <CardTitle className="text-white">Error Event</CardTitle>
              <CardDescription className="text-slate-400">
                Test critical error reporting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={sendErrorTest}
                disabled={loading.error}
                className="w-full bg-red-500 hover:bg-red-600 text-white"
              >
                {loading.error ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Error Test'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
        <Card className="bg-slate-900/50 border-slate-700/50 mt-6">
          <CardHeader>
            <CardTitle className="text-white text-sm">Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-400 font-mono">
            <div>
              <p className="text-slate-500 mb-1">User Event Endpoint:</p>
              <p className="break-all">{DEVOPS_ENDPOINTS.userEvent}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Revenue Endpoint:</p>
              <p className="break-all">{DEVOPS_ENDPOINTS.revenue}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Error Endpoint:</p>
              <p className="break-all">{DEVOPS_ENDPOINTS.error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
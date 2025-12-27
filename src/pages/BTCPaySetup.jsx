import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Copy, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BTCPaySetup() {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const { data: currentUser } = useQuery({
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

  const { data: packs = [] } = useQuery({
    queryKey: ['btcPacks'],
    queryFn: () => base44.entities.PointsPack.filter({ purchase_type: 'btc', enabled: true }),
  });

  const isAdmin = player?.is_admin || currentUser?.role === 'admin';

  const testConnection = async () => {
    if (packs.length === 0) {
      setTestResult({ success: false, message: 'No BTC packs found. Create one first!' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await base44.functions.invoke('createBTCPayInvoice', {
        pack_id: packs[0].id
      });

      if (response.data.success) {
        setTestResult({
          success: true,
          message: 'Connection successful! Invoice created.',
          invoice: response.data
        });
      } else {
        setTestResult({
          success: false,
          message: response.data.error || 'Failed to create invoice'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error.response?.data?.error || error.message || 'Connection failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const webhookUrl = `${window.location.origin}/api/btcpayWebhook`;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900 border-slate-700 max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-white">Admin access required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl('Admin')}>
              <Button variant="ghost" className="text-slate-400">
                ← Back
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            ⚡ BTCPay Server Setup
          </h1>
          <p className="text-slate-400">Configure Bitcoin payments for your casino</p>
        </div>

        {/* Step 1: Requirements */}
        <Card className="bg-slate-900 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Step 1: Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-slate-300 font-semibold">You'll need:</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>A BTCPay Server instance (self-hosted or BTCPay.com)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>A store created in BTCPay Server</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>An API key with invoice permissions</span>
                </li>
              </ul>
            </div>

            <Alert className="bg-amber-500/10 border-amber-500/30">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <AlertDescription className="text-amber-300 text-sm">
                Don't have BTCPay Server? Get started at{' '}
                <a 
                  href="https://btcpayserver.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-amber-200"
                >
                  btcpayserver.org
                </a>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Step 2: Get Credentials */}
        <Card className="bg-slate-900 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Step 2: Get Your Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 bg-slate-800 rounded-lg">
                <h4 className="text-white font-semibold mb-2">1. Server URL</h4>
                <p className="text-slate-400 text-sm mb-2">Your BTCPay Server URL (e.g., https://btcpay.yourdomain.com)</p>
                <code className="text-xs text-green-400 bg-slate-950 px-2 py-1 rounded">BTCPAY_SERVER_URL</code>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <h4 className="text-white font-semibold mb-2">2. Store ID</h4>
                <p className="text-slate-400 text-sm mb-2">
                  Go to: Stores → Settings → Store ID (top of page)
                </p>
                <code className="text-xs text-green-400 bg-slate-950 px-2 py-1 rounded">BTCPAY_STORE_ID</code>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <h4 className="text-white font-semibold mb-2">3. API Key</h4>
                <p className="text-slate-400 text-sm mb-2">
                  Go to: Account → API Keys → Create Key<br />
                  Permissions needed: <span className="text-amber-400">btcpay.store.cancreateinvoice</span>
                </p>
                <code className="text-xs text-green-400 bg-slate-950 px-2 py-1 rounded">BTCPAY_API_KEY</code>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <h4 className="text-white font-semibold mb-2">4. Webhook Secret (Optional but recommended)</h4>
                <p className="text-slate-400 text-sm mb-2">
                  Generate a random string (e.g., use a password generator)
                </p>
                <code className="text-xs text-green-400 bg-slate-950 px-2 py-1 rounded">BTCPAY_WEBHOOK_SECRET</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Set Secrets */}
        <Card className="bg-slate-900 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Step 3: Add Secrets to Base44</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-purple-500/10 border-purple-500/30 mb-4">
              <AlertDescription className="text-purple-300">
                <p className="font-semibold mb-2">📍 Where to set secrets:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Click your app name in the top-left corner</li>
                  <li>Go to <strong>"Settings"</strong> tab</li>
                  <li>Scroll to <strong>"Environment Variables"</strong> section</li>
                  <li>Click <strong>"+ Add Variable"</strong></li>
                  <li>Enter each secret name and value below</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <p className="text-slate-400 text-sm font-semibold">Secrets to add:</p>
              
              <div className="space-y-2">
                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm text-green-400 font-mono">BTCPAY_SERVER_URL</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard('BTCPAY_SERVER_URL')}
                      className="text-slate-400 hover:text-white h-6 px-2"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400">Your BTCPay Server URL (e.g., https://btcpay.yourdomain.com)</p>
                </div>

                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm text-green-400 font-mono">BTCPAY_STORE_ID</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard('BTCPAY_STORE_ID')}
                      className="text-slate-400 hover:text-white h-6 px-2"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400">Found in BTCPay: Stores → Settings → Store ID (at top)</p>
                </div>

                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm text-green-400 font-mono">BTCPAY_API_KEY</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard('BTCPAY_API_KEY')}
                      className="text-slate-400 hover:text-white h-6 px-2"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400">Create in BTCPay: Account → API Keys → Create (needs invoice permission)</p>
                </div>

                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm text-green-400 font-mono">BTCPAY_WEBHOOK_SECRET</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard('BTCPAY_WEBHOOK_SECRET')}
                      className="text-slate-400 hover:text-white h-6 px-2"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400">Generate a random secure string (like a password)</p>
                </div>
              </div>
            </div>

            <Alert className="bg-blue-500/10 border-blue-500/30">
              <AlertDescription className="text-blue-300 text-sm">
                💡 After adding all secrets in the dashboard, come back here and test the connection below!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Step 4: Configure Webhook */}
        <Card className="bg-slate-900 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Step 4: Configure BTCPay Webhook</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-400 text-sm">
              In BTCPay Server, go to: Stores → Settings → Webhooks → Create Webhook
            </p>

            <div className="space-y-3">
              <div>
                <Label className="text-slate-400">Payload URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(webhookUrl)}
                    className="border-slate-600"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-slate-400">Events to Subscribe</Label>
                <div className="mt-2 space-y-1 text-sm">
                  {['InvoiceSettled', 'InvoiceProcessing', 'InvoiceExpired', 'InvoiceInvalid'].map(event => (
                    <div key={event} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <code className="text-slate-300">{event}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-slate-400">Secret (if you set BTCPAY_WEBHOOK_SECRET)</Label>
                <p className="text-xs text-slate-500 mt-1">
                  Use the same random string you added to Base44 secrets
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 5: Test Connection */}
        <Card className="bg-slate-900 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Step 5: Test Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {packs.length === 0 ? (
              <Alert className="bg-amber-500/10 border-amber-500/30">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <AlertDescription className="text-amber-300 text-sm">
                  No BTC point packs found. Go to House Controls and create a BTC pack first!
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <p className="text-slate-400 text-sm">
                  Click the button below to test creating an invoice. This will verify your credentials are working.
                </p>

                <Button
                  onClick={testConnection}
                  disabled={testing}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>Test Connection</>
                  )}
                </Button>
              </>
            )}

            {testResult && (
              <Alert className={testResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <AlertDescription className={testResult.success ? 'text-green-300' : 'text-red-300'}>
                  <p className="font-semibold mb-2">{testResult.message}</p>
                  {testResult.success && testResult.invoice && (
                    <div className="space-y-1 text-xs">
                      <p>Invoice ID: {testResult.invoice.btcpay_invoice_id}</p>
                      <a
                        href={testResult.invoice.checkout_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-green-400 hover:text-green-300 underline"
                      >
                        View test invoice <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {!testResult.success && (
                    <p className="text-xs mt-2">
                      Common issues: Wrong URL, invalid API key, missing store permissions, or secrets not set in dashboard
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to={createPageUrl('BTCStore')}>
              <Button variant="outline" className="w-full border-slate-600 text-slate-300">
                Go to BTC Store →
              </Button>
            </Link>
            <Link to={createPageUrl('HouseControls')}>
              <Button variant="outline" className="w-full border-slate-600 text-slate-300">
                House Controls (Create BTC Packs) →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
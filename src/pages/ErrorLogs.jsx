import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  FileText,
  Search,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ErrorLogs() {
  const [selectedError, setSelectedError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

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

  const { data: errorLogs = [], isLoading } = useQuery({
    queryKey: ['errorLogs'],
    queryFn: () => base44.asServiceRole.entities.ErrorLog.list('-created_date', 500),
  });

  const updateErrorMutation = useMutation({
    mutationFn: ({ id, updates }) => base44.asServiceRole.entities.ErrorLog.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['errorLogs'] });
      toast.success('Error log updated');
      setSelectedError(null);
    },
  });

  const isAdmin = player?.is_admin || currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900/50 border-red-500/50">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400">Admin privileges required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const filteredErrors = errorLogs.filter(error => {
    const statusMatch = filterStatus === 'all' || error.status === filterStatus;
    const typeMatch = filterType === 'all' || error.error_type === filterType;
    const searchMatch = searchTerm === '' || 
      error.error_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.error_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.game_slug?.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && typeMatch && searchMatch;
  });

  const statusColors = {
    new: 'bg-red-500/20 text-red-400 border-red-500/50',
    investigating: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    resolved: 'bg-green-500/20 text-green-400 border-green-500/50',
    ignored: 'bg-slate-500/20 text-slate-400 border-slate-500/50'
  };

  const typeIcons = {
    game_load_failed: '🎮',
    function_error: '⚙️',
    api_error: '🌐',
    component_crash: '💥',
    other: '❓'
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const printErrorLog = (error) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Error Log: ${error.error_id}</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            h1 { color: #ef4444; }
            .section { margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px; }
            .label { font-weight: bold; color: #374151; }
            pre { background: #1f2937; color: #f9fafb; padding: 10px; border-radius: 4px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>🚨 Error Report</h1>
          <div class="section">
            <p><span class="label">Error ID:</span> ${error.error_id}</p>
            <p><span class="label">Type:</span> ${error.error_type}</p>
            <p><span class="label">Status:</span> ${error.status}</p>
            <p><span class="label">Date:</span> ${new Date(error.created_date).toLocaleString()}</p>
            <p><span class="label">User:</span> ${error.user_email}</p>
            ${error.game_slug ? `<p><span class="label">Game:</span> ${error.game_slug}</p>` : ''}
            <p><span class="label">Page:</span> ${error.page_url}</p>
          </div>
          <div class="section">
            <p class="label">Error Message:</p>
            <pre>${error.error_message}</pre>
          </div>
          ${error.error_stack ? `
          <div class="section">
            <p class="label">Stack Trace:</p>
            <pre>${error.error_stack}</pre>
          </div>
          ` : ''}
          ${error.additional_data && Object.keys(error.additional_data).length > 0 ? `
          <div class="section">
            <p class="label">Additional Data:</p>
            <pre>${JSON.stringify(error.additional_data, null, 2)}</pre>
          </div>
          ` : ''}
          <div class="section">
            <p class="label">User Agent:</p>
            <pre>${error.user_agent}</pre>
          </div>
          ${error.admin_notes ? `
          <div class="section">
            <p class="label">Admin Notes:</p>
            <pre>${error.admin_notes}</pre>
          </div>
          ` : ''}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const stats = {
    total: errorLogs.length,
    new: errorLogs.filter(e => e.status === 'new').length,
    investigating: errorLogs.filter(e => e.status === 'investigating').length,
    resolved: errorLogs.filter(e => e.status === 'resolved').length,
    gameErrors: errorLogs.filter(e => e.error_type === 'game_load_failed').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl('Admin')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">🚨 Error Logs</h1>
          <p className="text-slate-400 text-sm">Monitor and debug application errors</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="p-4">
              <p className="text-slate-400 text-xs">Total Errors</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-red-900/20 border-red-500/50">
            <CardContent className="p-4">
              <p className="text-red-400 text-xs">New</p>
              <p className="text-2xl font-bold text-red-400">{stats.new}</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-900/20 border-yellow-500/50">
            <CardContent className="p-4">
              <p className="text-yellow-400 text-xs">Investigating</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.investigating}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-900/20 border-green-500/50">
            <CardContent className="p-4">
              <p className="text-green-400 text-xs">Resolved</p>
              <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-900/20 border-purple-500/50">
            <CardContent className="p-4">
              <p className="text-purple-400 text-xs">Game Errors</p>
              <p className="text-2xl font-bold text-purple-400">{stats.gameErrors}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search error ID, message, user, or game..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-40 bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="ignored">Ignored</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="game_load_failed">Game Load Failed</SelectItem>
                  <SelectItem value="function_error">Function Error</SelectItem>
                  <SelectItem value="api_error">API Error</SelectItem>
                  <SelectItem value="component_crash">Component Crash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Error List */}
        <div className="space-y-3">
          {filteredErrors.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-slate-400">No errors found matching your filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredErrors.map((error) => (
              <Card key={error.id} className="bg-slate-900/50 border-slate-700/50 hover:border-slate-600 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{typeIcons[error.error_type]}</span>
                        <code className="text-amber-400 font-mono text-sm font-bold">
                          {error.error_id}
                        </code>
                        <Badge className={statusColors[error.status]}>
                          {error.status}
                        </Badge>
                        {error.game_slug && (
                          <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                            {error.game_slug}
                          </Badge>
                        )}
                      </div>
                      <p className="text-white text-sm mb-2 truncate">{error.error_message}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                        <span>👤 {error.user_email}</span>
                        <span>📅 {new Date(error.created_date).toLocaleString()}</span>
                        {error.page_url && <span>🔗 {new URL(error.page_url).pathname}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedError(error)}
                        className="border-slate-600"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => printErrorLog(error)}
                        className="border-slate-600"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Error Detail Dialog */}
        <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Error Details
              </DialogTitle>
            </DialogHeader>
            {selectedError && (
              <div className="space-y-4">
                {/* Header Info */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <code className="text-amber-400 font-mono font-bold text-lg">
                      {selectedError.error_id}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(selectedError.error_id)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400">Type</p>
                      <p className="text-white">{selectedError.error_type}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Status</p>
                      <Select
                        value={selectedError.status}
                        onValueChange={(status) => 
                          updateErrorMutation.mutate({ id: selectedError.id, updates: { status } })
                        }
                      >
                        <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="investigating">Investigating</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="ignored">Ignored</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-slate-400">User</p>
                      <p className="text-white">{selectedError.user_email}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Date</p>
                      <p className="text-white">{new Date(selectedError.created_date).toLocaleString()}</p>
                    </div>
                    {selectedError.game_slug && (
                      <div>
                        <p className="text-slate-400">Game</p>
                        <p className="text-purple-400">{selectedError.game_slug}</p>
                      </div>
                    )}
                    {selectedError.player_id && (
                      <div>
                        <p className="text-slate-400">Player ID</p>
                        <p className="text-white font-mono text-xs">{selectedError.player_id.slice(0, 12)}...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                <div>
                  <p className="text-slate-400 text-sm mb-2">Error Message</p>
                  <pre className="bg-slate-800 text-red-400 p-3 rounded-lg text-sm overflow-x-auto">
{selectedError.error_message}
                  </pre>
                </div>

                {/* Stack Trace */}
                {selectedError.error_stack && (
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Stack Trace</p>
                    <pre className="bg-slate-800 text-slate-300 p-3 rounded-lg text-xs overflow-x-auto max-h-48">
{selectedError.error_stack}
                    </pre>
                  </div>
                )}

                {/* Additional Data */}
                {selectedError.additional_data && Object.keys(selectedError.additional_data).length > 0 && (
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Additional Data</p>
                    <pre className="bg-slate-800 text-blue-400 p-3 rounded-lg text-xs overflow-x-auto max-h-48">
{JSON.stringify(selectedError.additional_data, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Page URL */}
                {selectedError.page_url && (
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Page URL</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-slate-800 text-cyan-400 p-2 rounded text-xs flex-1 overflow-x-auto">
                        {selectedError.page_url}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(selectedError.page_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* User Agent */}
                <div>
                  <p className="text-slate-400 text-sm mb-2">User Agent</p>
                  <pre className="bg-slate-800 text-slate-400 p-2 rounded text-xs overflow-x-auto">
{selectedError.user_agent}
                  </pre>
                </div>

                {/* Admin Notes */}
                <div>
                  <p className="text-slate-400 text-sm mb-2">Admin Notes</p>
                  <Textarea
                    defaultValue={selectedError.admin_notes || ''}
                    placeholder="Add notes about this error..."
                    className="bg-slate-800 border-slate-700 text-white min-h-24"
                    onBlur={(e) => {
                      if (e.target.value !== selectedError.admin_notes) {
                        updateErrorMutation.mutate({
                          id: selectedError.id,
                          updates: { admin_notes: e.target.value }
                        });
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
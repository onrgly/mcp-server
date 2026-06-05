import React, { useState } from "react";
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Shield, 
  ShieldAlert,
  Mail,
  UserPlus,
  MailWarning,
  UserX,
  UserCheck
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PanelUser {
  id: string;
  email: string;
  role: string;
  enabled: boolean;
  lastLogin: string;
}

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [users, setUsers] = useState<PanelUser[]>([
    { id: "1", email: "onurgulay@gmail.com", role: "Super Admin", enabled: true, lastLogin: new Date().toISOString() },
    { id: "2", email: "admin@smilecenter.tr", role: "Operator", enabled: true, lastLogin: new Date(Date.now() - 86400000).toISOString() },
  ]);

  const [newUser, setNewUser] = useState({ email: "", password: "", confirmPassword: "" });

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.password) {
      toast.error("Email and password are required");
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const user: PanelUser = {
      id: Math.random().toString(36).substr(2, 9),
      email: newUser.email,
      role: "Operator",
      enabled: true,
      lastLogin: "Never"
    };

    setUsers([...users, user]);
    setIsAddDialogOpen(false);
    setNewUser({ email: "", password: "", confirmPassword: "" });
    toast.success("User created successfully");
  };

  const toggleUserStatus = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, enabled: !u.enabled } : u));
    toast.success("User status updated");
  };

  const deleteUser = (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter(u => u.id !== id));
      toast.success("User deleted");
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage administrative access to the MCP control panel.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger render={
            <Button className="gap-2 ai-studio-gradient border-none text-white shadow-lg shadow-primary/20">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Admin User</DialogTitle>
              <DialogDescription>
                Provide credentials for a new administrative user.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="admin@example.com" 
                  value={newUser.email}
                  onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  placeholder="••••••••" 
                  value={newUser.password}
                  onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input 
                  id="confirm" 
                  type="password"
                  placeholder="••••••••" 
                  value={newUser.confirmPassword}
                  onChange={e => setNewUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateUser}>Create Account</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            className="pl-9 bg-secondary/30 border-border"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-border px-3 py-1 font-mono text-[11px] bg-secondary/30 uppercase tracking-wider text-muted-foreground">
            {users.length} Total Users
          </Badge>
        </div>
      </div>

      <Card className="glass-panel border-border shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="font-bold text-[10px] uppercase tracking-wider pl-8">User Account</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider">Role</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-center">Status</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider">Last Activity</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-wider pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-secondary/20 transition-colors border-border/40">
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full ai-studio-gradient flex items-center justify-center text-white font-bold text-xs">
                          {user.email.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-bold text-sm text-foreground">
                            {user.email}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5" /> ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        {user.role.toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 border",
                          user.enabled 
                          ? "bg-green-500/10 text-green-500 border-green-500/20" 
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}
                      >
                        {user.enabled ? "ACTIVE" : "SUSPENDED"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground font-mono">
                        {user.lastLogin === "Never" ? "Never" : new Date(user.lastLogin).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-foreground">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-48 shadow-xl">
                          <DropdownMenuItem className="gap-2">
                            <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => toggleUserStatus(user.id)}>
                            {user.enabled ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            {user.enabled ? "Suspend Access" : "Restore Access"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => deleteUser(user.id)}>
                            <Trash2 className="w-3.5 h-3.5" /> Remove User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-panel border-border bg-primary/5">
          <CardHeader className="pb-3">
             <div className="flex items-center gap-2 text-primary">
                <Shield className="w-4 h-4" />
                <CardTitle className="text-xs uppercase tracking-widest font-bold">Admin Privileges</CardTitle>
             </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Panel users can manage MCP servers, integrations, and view system logs. Ensure multi-factor authentication is enforced via your primary identity provider if this panel is exposed.
            </p>
          </CardContent>
        </Card>
        <Card className="glass-panel border-border">
          <CardHeader className="pb-3">
             <div className="flex items-center gap-2 text-foreground">
                <MailWarning className="w-4 h-4" />
                <CardTitle className="text-xs uppercase tracking-widest font-bold">Account Security</CardTitle>
             </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Suspended accounts are blocked from accessing any administrative functions immediately. Passwords are encrypted using enterprise-grade hashing algorithms.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

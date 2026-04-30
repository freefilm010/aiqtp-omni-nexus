import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Search, RefreshCw, Shield, UserCheck, Download, Crown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserWithRole {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  roles: string[];
}

const AdminUsersManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);

      if (pErr) throw pErr;
      if (rErr) throw rErr;

      const roleMap = new Map<string, string[]>();
      (roles || []).forEach((r) => {
        const existing = roleMap.get(r.user_id) || [];
        existing.push(r.role);
        roleMap.set(r.user_id, existing);
      });

      const merged: UserWithRole[] = (profiles || []).map((p) => ({
        ...p,
        roles: roleMap.get(p.id) || ["user"],
      }));

      setUsers(merged);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const exportUsers = () => {
    const data = filteredUsers.map((u) => ({
      id: u.id,
      profileName: u.username,
      username: u.username,
      roles: u.roles.join(", "),
      joined: u.created_at,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Users exported");
  };

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      u.roles.some((r) => r.includes(q))
    );
  });

  const adminCount = users.filter((u) => u.roles.includes("admin")).length;
  const modCount = users.filter((u) => u.roles.includes("moderator")).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground">View and manage all platform users and roles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportUsers}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-3">
            <Users className="h-4 w-4 text-primary mb-1" />
            <p className="text-lg font-bold">{users.length}</p>
            <p className="text-[10px] text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-3">
            <Crown className="h-4 w-4 text-amber-500 mb-1" />
            <p className="text-lg font-bold">{adminCount}</p>
            <p className="text-[10px] text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-3">
            <Shield className="h-4 w-4 text-blue-500 mb-1" />
            <p className="text-lg font-bold">{modCount}</p>
            <p className="text-[10px] text-muted-foreground">Moderators</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-3">
            <UserCheck className="h-4 w-4 text-green-500 mb-1" />
            <p className="text-lg font-bold">{users.length - adminCount - modCount}</p>
            <p className="text-[10px] text-muted-foreground">Regular Users</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, username, ID, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {filteredUsers.length} users {search && `matching "${search}"`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                            {user.username?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{user.username || `User ${user.id.slice(0, 6)}`}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{user.id.slice(0, 12)}…</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.username || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={role === "admin" ? "destructive" : role === "moderator" ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(user.updated_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsersManagement;

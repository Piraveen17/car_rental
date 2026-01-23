'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { IUser } from "@/types";
import { format } from 'date-fns';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    // 1. Optimistic Update (UI only)
    const oldUsers = [...users];
    setUsers(users.map(u => u._id === userId ? { ...u, role: newRole as any } : u));

    try {
      // 2. API Call
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (!res.ok) throw new Error('Failed to update role');
      
      toast({ title: 'Success', description: 'User role updated' });
      
    } catch (error) {
      // 3. Revert on failure
      setUsers(oldUsers);
      toast({ title: 'Error', description: 'Failed to update user role', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
      
      <Card>
        <CardHeader>
             <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="text-center py-4">Loading users...</div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user._id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'admin' ? 'default' : user.role === 'staff' ? 'secondary' : 'outline'}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>{user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : '-'}</TableCell>
                                <TableCell>
                                    <Select 
                                        defaultValue={user.role} 
                                        onValueChange={(val) => handleRoleChange(user._id!, val)}
                                        disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1} // Prevent removing last admin (basic check)
                                    >
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="customer">Customer</SelectItem>
                                            <SelectItem value="staff">Staff</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

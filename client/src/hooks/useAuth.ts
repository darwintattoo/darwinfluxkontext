import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: authData, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      return apiRequest("POST", "/api/login", { username, password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      queryClient.setQueryData(["/api/auth/user"], { authenticated: false });
    },
  });

  return {
    isAuthenticated: authData?.authenticated || false,
    isLoading,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    loginError: loginMutation.error,
    isLoginPending: loginMutation.isPending,
  };
}
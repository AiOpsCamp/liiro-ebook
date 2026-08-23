import { getToken } from "@/lib/utils";
import { useEffect, useState } from "react";

export const useGetToken = () => {
  const [token, setToken] = useState("");
  useEffect(() => {
    const tokenizedFn = async () => {
      const res = await getToken("token");
      setToken(res as string);
    };
    tokenizedFn();
  }, []);
  return token;
};

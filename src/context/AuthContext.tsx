import {
  useContext,
  createContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

interface UserTypes {
  name: string;
  userId: string;
  picture: string;
  email: string;
}

interface AuthContextInterface {
  user: UserTypes;
  setUser: (value: UserTypes) => void;
  token: string | null;
  setToken: (value: string | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextInterface | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth Must be used with AuthContext ");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({
    userId: "",
    picture: "",
    name: "",
    email: "",
  });
  const [token, setToken] = useState("");

  const logout = () => {
    setUser({
      userId: "",
      picture: "",
      name: "",
      email: "",
    });
    setToken("");
    Cookies.remove("token");
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const token = Cookies.get("token");

    if (token) {
      const user: UserTypes = jwtDecode(token);
      setUser({
        userId: user?.user_id,
        picture: user?.picture,
        name: user?.name,
        email: user?.email,
      });
    }

    const userId = user?.userId;
    const name = user?.name;

    if (token && name && userId) {
      setIsAuthenticated(true);
    }
  }, [user?.userId, token]);

  const value = {
    isAuthenticated,
    setIsAuthenticated,
    user,
    setUser,
    token,
    setToken,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

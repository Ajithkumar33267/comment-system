import {
  Avatar,
  Button,
  Card,
  CardBody,
  IconButton,
  List,
  ListItem,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
} from "@material-tailwind/react";
import React, { useState, useRef } from "react";
import { FaBold, FaItalic, FaStrikethrough, FaUnderline } from "react-icons/fa";
import { GrAttachment } from "react-icons/gr";
import SignInWithGoogle from "./SignInWithGoogle";
import { useAuth } from "../context/AuthContext";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { firestore } from "../utils/firebase.ts";
import CommentsList from "./CommentsList.tsx";
import { MdLogout } from "react-icons/md";

const TextEditor: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const [isStrikeThrough, setIsStrikeThrough] = useState(false);
  const [commentLength, setCommentLength] = useState<number>(0);

  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const contentEditableRef = useRef<HTMLDivElement>(null);

  const toggleFormat = (
    command: string,
    stateSetter: React.Dispatch<React.SetStateAction<boolean>>,
    currentState: boolean
  ) => {
    document.execCommand(command, false, "");
    stateSetter(!currentState);
    if (contentEditableRef.current) {
      contentEditableRef.current.focus();
    }
  };

  const handleTagging = async (searchTerm: string) => {
    if (searchTerm.startsWith("@")) {
      const q = searchTerm.slice(1);
      const usersRef = collection(firestore, "users");
      const qQuery = query(
        usersRef,
        where("username", ">=", q),
        where("username", "<=", q + "\uf8ff")
      );
      const querySnapshot = await getDocs(qQuery);
      const users = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSuggestedUsers(users);
    }
  };

  const handleInputChange = () => {
    if (contentEditableRef.current) {
      const content = contentEditableRef.current.innerText;
      const newLength = content.length;
      const lastWord = content.split(" ").pop();
      if (lastWord) {
        handleTagging(lastWord);
      } else {
        setSuggestedUsers([]);
      }
      if (newLength > 250) {
        contentEditableRef.current.innerText = content.slice(0, 250);
      }
      setCommentLength(contentEditableRef.current.innerText.length);

      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      setTimeout(() => {
        if (range && selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }, 0);
    }
  };

  const handleSubmit = async () => {
    if (contentEditableRef.current) {
      const comment = contentEditableRef.current.innerHTML;
      if (!isAuthenticated) return alert("Login Required!");
      if (comment.trim() === "") {
        alert("Please enter a comment");
        return;
      }

      if (isAuthenticated && comment) {
        await addDoc(collection(firestore, "comments"), {
          userId: user.userId,
          userName: user.name,
          userPhoto: user.picture,
          content: comment,
          createdAt: serverTimestamp(),
          reactions: {},
          totalReactions: 0,
          taggedUserIds: selectedUserIds,
        });
      }
      contentEditableRef.current.innerHTML = "";
      setIsBold(false);
      setIsItalic(false);
      setIsUnderline(false);
      setIsStrikeThrough(false);
      setCommentLength(0);
      setSelectedUserIds([]);
    }
  };

  const handleUserSelect = (user: any) => {
    if (contentEditableRef.current) {
      let comment = contentEditableRef.current.innerHTML;
      contentEditableRef.current.innerHTML = comment.replace(
        /@\w*$/,
        `@${user.username} `
      );
      setSelectedUserIds([...selectedUserIds, user.id]);
      setSuggestedUsers([]);
    }
  };

  return (
    <Card className="md:w-3/6  w-5/6 mt-10 mx-auto p-2 md:p-6 bg-white border rounded-md shadow-md">
      <CardBody>
        <div className="mb-6">
          <div className="flex justify-end mb-2">
            {user?.userId && isAuthenticated ? (
              <Menu>
                <MenuHandler>
                  <div className="flex items-center gap-3 cursor-pointer">
                    <Avatar src={user?.picture} alt={user?.name} />
                    <h1>{user?.name}</h1>
                  </div>
                </MenuHandler>
                <MenuList>
                  <MenuItem
                    onClick={logout}
                    className="flex gap-2 text-red-500 hover:text-red-500"
                  >
                    <MdLogout />
                    Logout
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <SignInWithGoogle />
            )}
          </div>
          <div className="border rounded-md relative p-4 mb-4">
            <div
              ref={contentEditableRef}
              contentEditable
              className="w-full p-2 border rounded  focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              onInput={handleInputChange}
              style={{
                minHeight: "100px",
                maxHeight: "300px",
                overflowY: "auto",
              }}
              placeholder="Write your comment..."
            ></div>
            {suggestedUsers.length > 0 && (
              <Card className="absolute bottom-20">
                <List>
                  {suggestedUsers.map((user) => (
                    <ListItem
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                    >
                      {user.displayName} (@{user.username})
                    </ListItem>
                  ))}
                </List>
              </Card>
            )}
            <p className="mt-2 text-sm justify-end flex text-gray-600">
              {commentLength}/250
            </p>

            <div className="flex justify-between  items-center mt-2">
              <div className="flex md:flex-row flex-col space-x-2">
                <IconButton
                  ripple={false}
                  variant={isBold ? "filled" : "text"}
                  className="text-sm"
                  onClick={() => toggleFormat("bold", setIsBold, isBold)}
                >
                  <FaBold />
                </IconButton>
                <IconButton
                  ripple={false}
                  variant={isItalic ? "filled" : "text"}
                  className="text-sm"
                  onClick={() => toggleFormat("italic", setIsItalic, isItalic)}
                >
                  <FaItalic />
                </IconButton>
                <IconButton
                  ripple={false}
                  variant={isUnderline ? "filled" : "text"}
                  className="text-sm"
                  onClick={() =>
                    toggleFormat("underline", setIsUnderline, isUnderline)
                  }
                >
                  <FaUnderline />
                </IconButton>
                <IconButton
                  ripple={false}
                  variant={isStrikeThrough ? "filled" : "text"}
                  className="text-sm"
                  onClick={() =>
                    toggleFormat(
                      "strikeThrough",
                      setIsStrikeThrough,
                      isStrikeThrough
                    )
                  }
                >
                  <FaStrikethrough />
                </IconButton>
                <IconButton ripple={false} variant="text" className="text-sm">
                  <GrAttachment className="h-4 w-4" />
                </IconButton>
              </div>
              <Button
                className="bg-black text-white capitalize"
                onClick={handleSubmit}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
        <CommentsList />
      </CardBody>
    </Card>
  );
};

export default TextEditor;

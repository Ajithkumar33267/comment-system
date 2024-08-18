import {
  Avatar,
  Button,
  IconButton,
  Popover,
  PopoverContent,
  PopoverHandler,
  Tab,
  Tabs,
  TabsHeader,
} from "@material-tailwind/react";
import {
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { FaReply, FaTrash } from "react-icons/fa";
import { firestore } from "../utils/firebase";
import { MdAddReaction } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import { Pagination } from "./Pagination";

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  content: string;
  createdAt: any;
  reactions: { [key: string]: number };
}

const CommentsList = () => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [sortType, setSortType] = useState<"latest" | "popular">("latest");

  const [currentItems, setCurrentItems] = useState([]);
  const [users, setUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    let q;
    if (sortType === "latest") {
      q = query(
        collection(firestore, "comments"),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(firestore, "comments"),
        orderBy("totalReactions", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const commentsArray: Comment[] = [];
      querySnapshot.forEach((doc) => {
        commentsArray.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(commentsArray);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [sortType]);

  const handleReaction = async (commentId: string, reactionType: string) => {
    if (!isAuthenticated) return alert("Login Required!");
    const commentRef = doc(firestore, "comments", commentId);
    await updateDoc(commentRef, {
      [`reactions.${reactionType}`]: increment(1),
      totalReactions: increment(1),
    });
  };

  function formateTime(time) {
    const milliseconds = time?.seconds * 1000 + time?.nanoseconds / 1000000;

    const now = Date.now();

    const difference = now - milliseconds;

    if (difference < 60000) {
      return `${Math.floor(difference / 1000)} seconds ago`;
    } else if (difference < 3600000) {
      return `${Math.floor(difference / 60000)} minutes ago`;
    } else if (difference < 86400000) {
      return `${Math.floor(difference / 3600000)} hours ago`;
    } else if (difference < 2592000000) {
      return `${Math.floor(difference / 86400000)} days ago`;
    } else {
      return `${Math.floor(difference / 2592000000)} months ago`;
    }
  }

  const renderComment = (comment: string, users: any[]) => {
    const regex = /(@\w+\.\w+)/g;
    const parts = comment.split(regex);

    return parts.map((part, index) => {
      if (part.match(regex)) {
        const taggedUser = users.find((user) => `@${user.username}` === part);
        if (taggedUser) {
          return (
            <span key={index} className="text-blue-500">
              {part}
            </span>
          );
        }
      } else {
        return (
          <span
            className="mt-2 p-2 rounded bg-white"
            key={index}
            dangerouslySetInnerHTML={{ __html: part }}
          />
        );
      }
      return part;
    });
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(firestore, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map((doc) => doc.data());
        setUsers(usersList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users: ", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) <div>Loading...</div>;

  return (
    <>
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>
        <Tabs value="latest">
          <TabsHeader>
            <Tab
              value={"latest"}
              className="text-sm"
              onClick={() => setSortType("latest")}
            >
              Latest
            </Tab>
            <Tab
              value={"popular"}
              className="text-sm"
              onClick={() => setSortType("popular")}
            >
              Popular
            </Tab>
          </TabsHeader>
        </Tabs>
      </div>
      <div className="flex  flex-col mb-4">
        {currentItems && currentItems.length > 0 ? (
          currentItems.map((comment) => (
            <div key={comment.id} className="border-2 mt-5 rounded-lg p-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  <Avatar src={comment.userPhoto} alt={comment.userName} />
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold">{comment.userName}</h3>
                    <span className="text-xs text-muted-foreground">
                      {formateTime(comment?.createdAt)}
                    </span>
                  </div>
                </div>
                {comment.userId === user.userId && (
                  <IconButton
                    variant="text"
                    className="rounded-xl text-red-600"
                  >
                    <FaTrash />
                  </IconButton>
                )}
              </div>
              <div className="ml-10">
                {renderComment(comment.content, users)}
                {/* <div className="flex items-center mt-2">
                <img
                  src="/placeholder.svg"
                  alt="Image"
                  className="w-12 h-12 rounded-md"
                  width="50"
                  height="50"
                  style={{ aspectRatio: "50/50", objectFit: "cover" }}
                />
              </div> */}
                <div className="flex items-center mt-2 space-x-2">
                  <Popover>
                    <PopoverHandler>
                      <IconButton variant="text">
                        <MdAddReaction className="text-gray-700" />
                      </IconButton>
                    </PopoverHandler>
                    <PopoverContent className="z-50 max-w-[26rem]">
                      <div className="flex gap-2">
                        <IconButton
                          className="text-3xl"
                          variant="text"
                          onClick={() => handleReaction(comment.id, "like")}
                        >
                          👍
                        </IconButton>
                        <IconButton
                          className="text-3xl"
                          variant="text"
                          onClick={() => handleReaction(comment.id, "love")}
                        >
                          ❤️
                        </IconButton>
                        <IconButton
                          className="text-3xl"
                          variant="text"
                          onClick={() => handleReaction(comment.id, "laugh")}
                        >
                          😂
                        </IconButton>
                        <IconButton
                          className="text-3xl"
                          variant="text"
                          onClick={() =>
                            handleReaction(comment.id, "surprised")
                          }
                        >
                          😮
                        </IconButton>
                        <IconButton
                          className="text-3xl"
                          variant="text"
                          onClick={() => handleReaction(comment.id, "sad")}
                        >
                          😢
                        </IconButton>
                        <IconButton
                          className="text-3xl"
                          variant="text"
                          onClick={() => handleReaction(comment.id, "angry")}
                        >
                          😡
                        </IconButton>
                      </div>
                    </PopoverContent>
                  </Popover>
                  {comment.reactions.like > 0 && (
                    <span className="text-base border-2 rounded-2xl p-2">
                      👍 {comment.reactions.like}
                    </span>
                  )}
                  {comment.reactions.love > 0 && (
                    <span className="text-base border-2 rounded-2xl p-2">
                      ❤️ {comment.reactions.love}
                    </span>
                  )}
                  {comment.reactions.laugh > 0 && (
                    <span className="text-base border-2 rounded-2xl p-2">
                      😂 {comment.reactions.laugh}
                    </span>
                  )}
                  {comment.reactions.surprised > 0 && (
                    <span className="text-base border-2 rounded-2xl p-2">
                      😮 {comment.reactions.surprised}
                    </span>
                  )}
                  {comment.reactions.sad > 0 && (
                    <span className="text-base border-2 rounded-2xl p-2">
                      😢 {comment.reactions.sad}
                    </span>
                  )}
                  {comment.reactions.angry > 0 && (
                    <span className="text-base border-2 rounded-2xl p-2">
                      😡 {comment.reactions.angry}
                    </span>
                  )}
                  <Button
                    variant="text"
                    className="text-sm flex items-center gap-2"
                  >
                    <FaReply />
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div> No Comments Found!</div>
        )}
      </div>
      <Pagination
        setCurrentItems={setCurrentItems}
        usersPerPage={8}
        users={comments}
      />
    </>
  );
};

export default CommentsList;

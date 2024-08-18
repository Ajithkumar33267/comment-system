import { Dispatch, SetStateAction, useState, useEffect } from "react";
import ReactPaginate from "react-paginate";

export const Pagination = ({
  users,
  usersPerPage,
  setCurrentItems,
}: {
  users: any[];
  usersPerPage: number;
  setCurrentItems: Dispatch<SetStateAction<any[]>>;
}) => {
  const [itemOffset, setItemOffset] = useState(0);

  useEffect(() => {
    const endOffset = itemOffset + usersPerPage;
    setCurrentItems(users.slice(itemOffset, endOffset));
  }, [itemOffset, users, usersPerPage, setCurrentItems]);

  const pageCount = Math.ceil(users.length / usersPerPage);

  const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * usersPerPage) % users.length;
    setItemOffset(newOffset);
  };

  return (
    <>
      <ReactPaginate
        nextLabel="Next -->"
        onPageChange={handlePageClick}
        pageRangeDisplayed={3}
        marginPagesDisplayed={2}
        pageCount={pageCount}
        previousLabel="<-- Previous"
        pageClassName="page-item"
        pageLinkClassName="page-link"
        previousClassName="page-item"
        previousLinkClassName="page-link"
        nextClassName="page-item"
        nextLinkClassName="page-link"
        breakLabel="..."
        breakClassName="page-item"
        breakLinkClassName="page-link"
        containerClassName="pagination"
        activeClassName="active"
        renderOnZeroPageCount={null}
      />
    </>
  );
};

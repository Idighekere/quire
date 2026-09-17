import { optionalAuth, protectRoute, restrict } from '@/middlewares';
import { Role } from '@/common/constants';
import {
  addBook,
  deleteBook,
  getAllBooks,
  getBookById,
  getBooksByCourse,
  getBooksByUser,
  listPendingBooks,
  moderateBook,
  updateBook,
} from '@/controllers'
import express from 'express'


const booksRoute = express.Router()

// Static paths (/all, /pending, /course/:courseCode) are declared before the
// parameterized routes so they are never swallowed by /:bookId.
booksRoute.route("/").post(protectRoute, addBook).get(protectRoute, getBooksByUser)
booksRoute.route("/all").get(getAllBooks)
booksRoute.route("/pending").get(protectRoute, restrict(Role.Admin), listPendingBooks)
booksRoute.route("/course/:courseCode").get(getBooksByCourse)
booksRoute.route("/:bookId/status").patch(protectRoute, restrict(Role.Admin), moderateBook)
booksRoute.route("/:bookId").get(optionalAuth, getBookById).patch(protectRoute, updateBook).delete(protectRoute, deleteBook)

export default booksRoute
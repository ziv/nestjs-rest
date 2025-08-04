import { faker } from "@faker-js/faker";
import { MongoClient } from "mongodb";
import * as process from "node:process";

/**
 * Data generation script for demo purposes.
 *
 * Author
 *  id
 *  name
 *  email
 *
 * Comment
 *  id
 *  authorId
 *  articleId
 *  content
 *
 * Article
 *  id
 *  title
 *  content
 *  authorId
 *  createdAt
 *  updatedAt
 *  comments
 */

type Author = {
  id: number;
  name: string;
  email: string;
};

type Article = {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: Date;
  // comments: Comment[];
};

type Comment = {
  id: number;
  createdAt: Date;
  authorId: number;
  articleId: number;
  content: string;
};

async function main() {
  const authors: Author[] = [];
  const articles: Article[] = [];
  const comments: Comment[] = [];

  function author(id: number) {
    return {
      id,
      name: faker.person.fullName(),
      email: faker.internet.email(),
    };
  }

  function article(id: number, authorId: number) {
    return {
      id,
      authorId,
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(1),
      createdAt: faker.date.past({ years: 1 }),
    };
  }

  function comment(articleId: number, authorId: number) {
    return {
      id: articleId * authorId,
      authorId,
      articleId,
      createdAt: faker.date.past({ years: 1 }),
      content: faker.lorem.sentence(),
    };
  }

  for (let i = 0; i < 100; ++i) {
    authors.push(author(i + 1000));
  }

  // each second author has 3 articles
  for (let i = 0; i < authors.length; ++i) {
    if (i % 2 !== 0) {
      continue;
    }
    for (let j = 0; j < 3; ++j) {
      articles.push(article(authors[i].id + j + i, authors[i].id));
    }
  }

  // each article has 5 comments
  for (let i = 0; i < articles.length; ++i) {
    for (let j = 0; j < 5; ++j) {
      const author = Math.floor(Math.random() * authors.length);
      comments.push(comment(articles[i].id, authors[author].id));
    }
  }

  const client = new MongoClient("mongodb://localhost:27017");
  await client.connect();

  await client.db("demo").collection("authors").insertMany(authors);
  await client.db("demo").collection("articles").insertMany(articles);
  await client.db("demo").collection("comments").insertMany(comments);

  console.log(
    `Inserted ${authors.length} authors, ${articles.length} articles, and ${comments.length} comments.`,
  );

  await client.close();
  process.exit(0);
}

main().catch(console.error);

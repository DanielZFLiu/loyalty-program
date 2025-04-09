This is a generic loyalty program implemented with the following stack:
1. React
2. Tailwind
3. SQLite
4. Expressjs
5. Prisma

The goal of this course project is to familiarize ourselves with the above stack, as well as the process of designing/implementing from the grounds up.

Notice: due to usage of shadcn ui, code within src/components/ui were not written by us.

To run the project locally, you have to separately initialize both backend and frontend. 

# Backend
cd to the backend folder. Then run the following commands:
```
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
node index.js 3000
```

Optionally, run `npx prisma studio` after setting up to see the database with a more user friendly ui.

# Frontend
Open another terminal. cd to the frontend folder, then run the following commands:
```
npm install
npm run dev
```
You should see a link akin to http://localhost:5173/.

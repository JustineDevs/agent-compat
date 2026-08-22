# Branch strategy

- `main` is production and is used for released SDK and documentation changes.
- `dev` is the persistent preview branch and is the default development target.
- Changes land on `main` through reviewed pull requests from `dev`.

The Vercel project is named `agents`. Connect its preview branch to `dev` and
its production branch to `main`; domain and DNS configuration remain managed
in Vercel.

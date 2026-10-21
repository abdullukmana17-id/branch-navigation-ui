import { useRef, useState } from "react";
import Nav from "./Nav";

const menus = [
  {
    title: "Dashboard",
    label: (
      <>
        <div className="icon">
          <i className="bi bi-house-door" />
        </div>
        <span>Dashboard</span>
      </>
    ),
    to: "/",
  },
  {
    category: "Manajemen",
    title: "Menu Manajemen",
    label: (
      <>
        <div className="icon">
          <i className="bi bi-grid" />
        </div>
        <span>Manajemen</span>
      </>
    ),
    menus: [
      {
        title: "Pengguna",
        label: (
          <>
            <div className="icon">
              <i className="bi bi-people" />
            </div>
            <span>Pengguna</span>
          </>
        ),
        to: "/users",
      },
      {
        title: "Peran",
        label: (
          <>
            <div className="icon">
              <i className="bi bi-shield-lock" />
            </div>
            <span>Peran</span>
          </>
        ),
        to: "/roles",
      },
      {
        category: "Konten",
        title: "Manajemen Konten",
        label: (
          <>
            <div className="icon">
              <i className="bi bi-folder2-open" />
            </div>
            <span>Konten</span>
          </>
        ),
        menus: [
          {
            title: "Artikel",
            label: (
              <>
                <div className="icon">
                  <i className="bi bi-file-earmark-text" />
                </div>
                <span>Artikel</span>
              </>
            ),
            to: "/articles",
          },
          {
            title: "Kategori Artikel",
            label: (
              <>
                <div className="icon">
                  <i className="bi bi-tags" />
                </div>
                <span>Kategori Artikel</span>
              </>
            ),
            to: "/article-categories",
          },
        ],
      },
    ],
  },
  {
    category: "Laporan",
    title: "Menu Laporan",
    label: (
      <>
        <div className="icon">
          <i className="bi bi-bar-chart-line" />
        </div>
        <span>Laporan</span>
      </>
    ),
    menus: [
      {
        title: "Laporan Pengguna",
        label: (
          <>
            <div className="icon">
              <i className="bi bi-person-lines-fill" />
            </div>
            <span>Laporan Pengguna</span>
          </>
        ),
        to: "/reports/users",
      },
      {
        title: "Laporan Aktivitas",
        label: (
          <>
            <div className="icon">
              <i className="bi bi-activity" />
            </div>
            <span>Laporan Aktivitas</span>
          </>
        ),
        to: "/reports/activities",
      },
    ],
  },
];

function App() {
  const navRef = useRef(null);
  const [isHidden, setIsHidden] = useState(false);

  return (
    <section className="py-5">
      <div className="container">
        <div className="row">
          <div className={`col-12 ${isHidden ? "hide" : ""}`}>
            <div className="d-flex gap-2 mb-3">
              <button
                type="button"
                className="btn btn-dark rounded-0"
                onClick={() =>
                  navRef.current?.showTooltips()
                }
              >
                Tampilkan Tooltip
              </button>

              <button
                type="button"
                className="btn btn-dark rounded-0"
                onClick={() =>
                  navRef.current?.hideTooltips()
                }
              >
                Sembunyikan Tooltip
              </button>

              <button
                type="button"
                className="btn btn-primary rounded-0"
                onClick={() => setIsHidden((prev) => !prev)}
              >
                {isHidden ? "Tampilkan Konten" : "Sembunyikan Konten"}
              </button>
            </div>

            <Nav ref={navRef} menus={menus} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default App;

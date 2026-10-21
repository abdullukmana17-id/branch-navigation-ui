
import {
    forwardRef,
    useId,
    useEffect,
    useRef,
    useState,
    useImperativeHandle,
} from "react";
import { NavLink, useLocation } from "react-router-dom";

const STORAGE_KEY = "nav-accordion-state";

function hasCategory(obj) {
    return Object.prototype.hasOwnProperty.call(obj, "category");
}

function useIsWide(breakpoint = 576) {
    const [isWide, setIsWide] = useState(
        () =>
            typeof window !== "undefined" &&
            window.innerWidth > breakpoint
    );

    useEffect(() => {
        const handleResize = () => {
            setIsWide(window.innerWidth > breakpoint);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [breakpoint]);

    return isWide;
}

// Membaca status accordion dari localStorage.
function getSavedAccordionState() {
    if (typeof window === "undefined") {
        return {};
    }

    try {
        return JSON.parse(
            window.localStorage.getItem(STORAGE_KEY) || "{}"
        );
    } catch {
        return {};
    }
}

const Nav = forwardRef(function Nav({ menus }, ref) {
    const navRef = useRef(null);
    const isWide = useIsWide(576);

    const [tooltipsEnabled, setTooltipsEnabled] = useState(false);

    // Status accordion dibagikan ke semua kategori.
    const [accordionState, setAccordionState] = useState(
        getSavedAccordionState
    );

    const showTooltips = tooltipsEnabled && isWide;

    // Simpan status accordion setiap kali ada perubahan.
    useEffect(() => {
        try {
            window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(accordionState)
            );
        } catch {
            // Abaikan jika localStorage tidak tersedia.
        }
    }, [accordionState]);

    // API untuk mengontrol tooltip dan accordion.
    useImperativeHandle(
        ref,
        () => ({
            showTooltips() {
                setTooltipsEnabled(true);
            },

            hideTooltips() {
                setTooltipsEnabled(false);
            },

            toggleTooltips() {
                setTooltipsEnabled((current) => !current);
            },

            setTooltips(enabled) {
                setTooltipsEnabled(Boolean(enabled));
            },

            getTooltipsState() {
                return tooltipsEnabled;
            },

            // Membuka accordion berdasarkan key.
            openAccordion(key) {
                setAccordionState((current) => ({
                    ...current,
                    [key]: true,
                }));
            },

            // Menutup accordion berdasarkan key.
            closeAccordion(key) {
                setAccordionState((current) => ({
                    ...current,
                    [key]: false,
                }));
            },

            // Mengubah status accordion.
            toggleAccordion(key) {
                setAccordionState((current) => ({
                    ...current,
                    [key]: !(current[key] ?? false),
                }));
            },

            // Mengatur status accordion secara langsung.
            setAccordion(key, isOpen) {
                setAccordionState((current) => ({
                    ...current,
                    [key]: Boolean(isOpen),
                }));
            },

            // Membaca seluruh status accordion.
            getAccordionState() {
                return accordionState;
            },

            // Menghapus status accordion yang tersimpan.
            resetAccordionState() {
                setAccordionState({});
            },
        }),
        [tooltipsEnabled, accordionState]
    );

    // Inisialisasi tooltip Bootstrap.
    useEffect(() => {
        if (
            !showTooltips ||
            !navRef.current ||
            !window.bootstrap?.Tooltip
        ) {
            return;
        }

        const elements =
            navRef.current.querySelectorAll(".has-tooltip");

        const instances = Array.from(elements).map((element) =>
            window.bootstrap.Tooltip.getOrCreateInstance(element, {
                html: false,
                placement: element.dataset.bsPlacement || "right",
            })
        );

        return () => {
            instances.forEach((instance) => instance.dispose());
        };
    }, [showTooltips, menus, accordionState]);

    return (
        <div ref={navRef}>
            {menus && (
                <Accordion>
                    <AccordionItem
                        menus={menus}
                        showTooltips={showTooltips}
                        accordionState={accordionState}
                        setAccordionState={setAccordionState}
                    />
                </Accordion>
            )}
        </div>
    );
});

export default Nav;

function Accordion({ children }) {
    const accordionId = useId();

    return (
        <div className="accordion" id={`accordion-${accordionId}`}>
            {children}
        </div>
    );
}

// Membuat key stabil untuk setiap kategori.
function getAccordionKey(menu, parentKey = "root", index = 0) {
    const identity =
        menu.id ??
        menu.key ??
        menu.category ??
        menu.title ??
        index;

    return `${parentKey}/${String(identity)}`;
}

function AccordionItem({
    menus = [],
    depth = 0,
    showTooltips = false,
    accordionState,
    setAccordionState,
    parentKey = "root",
}) {
    return (
        <>
            {menus.map((menu, index) => {
                if (hasCategory(menu)) {
                    const accordionKey = getAccordionKey(
                        menu,
                        parentKey,
                        index
                    );

                    return (
                        <AccordionCategory
                            key={accordionKey}
                            menu={menu}
                            depth={depth}
                            showTooltips={showTooltips}
                            accordionKey={accordionKey}
                            accordionState={accordionState}
                            setAccordionState={setAccordionState}
                        />
                    );
                }

                const baseClassName = [
                    "text-decoration-none",
                    "btn rounded-2 mb-1 w-100 text-start",
                    "p-2 py-0 d-flex align-items-center",
                    showTooltips ? "has-tooltip" : "",
                ]
                    .filter(Boolean)
                    .join(" ");

                const commonProps = {
                    style: { "--depth": depth },
                    "data-bs-title": showTooltips
                        ? menu.title || menu.label
                        : undefined,
                    "data-bs-placement": "right",
                };

                return (
                    <div
                        key={
                            menu.id ??
                            menu.key ??
                            menu.to ??
                            menu.href ??
                            index
                        }
                        className="accordion-item p-0"
                    >
                        {menu.to ? (
                            <NavLink
                                {...commonProps}
                                to={menu.to}
                                end
                                className={({ isActive }) =>
                                    [
                                        baseClassName,
                                        isActive
                                            ? "btn-primary active text-nowrap"
                                            : "btn-light text-nowrap",
                                    ].join(" ")
                                }
                            >
                                {menu.label}
                            </NavLink>
                        ) : (
                            <a
                                {...commonProps}
                                href={menu.href}
                                className={`${baseClassName} btn-light text-nowrap`}
                            >
                                {menu.label}
                            </a>
                        )}
                    </div>
                );
            })}
        </>
    );
}

function hasActiveChild(menu, pathname) {
    if (!hasCategory(menu)) {
        return Boolean(
            menu.to &&
            (pathname === menu.to ||
                pathname.startsWith(`${menu.to}/`))
        );
    }

    return (
        menu.menus?.some((child) =>
            hasActiveChild(child, pathname)
        ) ?? false
    );
}

function AccordionCategory({
    menu,
    depth,
    showTooltips,
    accordionKey,
    accordionState,
    setAccordionState,
}) {
    const collapseId = useId();
    const headerId = useId();

    const safeCollapseId = `collapse-${collapseId.replace(/:/g, "")}`;
    const safeHeaderId = `header-${headerId.replace(/:/g, "")}`;

    const { pathname } = useLocation();

    // Jika belum memiliki status tersimpan, gunakan status
    // berdasarkan halaman aktif sebagai nilai awal.
    const hasSavedState = Object.prototype.hasOwnProperty.call(
        accordionState,
        accordionKey
    );

    const isOpen = hasSavedState
        ? accordionState[accordionKey]
        : hasActiveChild(menu, pathname);

    function toggleAccordion() {
        setAccordionState((current) => ({
            ...current,
            [accordionKey]: !(
                Object.prototype.hasOwnProperty.call(
                    current,
                    accordionKey
                )
                    ? current[accordionKey]
                    : hasActiveChild(menu, pathname)
            ),
        }));
    }

    return (
        <div className="accordion-item">
            <h2
                className="accordion-header"
                id={safeHeaderId}
            >
                <button
                    className={[
                        "accordion-button border btn btn-light",
                        "p-2 py-0 rounded-2 mb-1 font-sans",
                        isOpen ? "" : "collapsed",
                        showTooltips ? "has-tooltip" : "",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                    type="button"
                    onClick={toggleAccordion}
                    aria-expanded={isOpen}
                    aria-controls={safeCollapseId}
                    data-bs-title={
                        showTooltips
                            ? menu.title || menu.category
                            : undefined
                    }
                    data-bs-placement="right"
                    style={{ "--depth": depth }}
                >
                    {menu.label}
                </button>
            </h2>

            <div
                id={safeCollapseId}
                className={[
                    "accordion-collapse collapse",
                    isOpen ? "show" : "",
                ]
                    .filter(Boolean)
                    .join(" ")}
                aria-labelledby={safeHeaderId}
            >
                <div className="accordion-body p-0">
                    <Accordion>
                        <AccordionItem
                            menus={menu.menus || []}
                            depth={depth + 1}
                            showTooltips={showTooltips}
                            accordionState={accordionState}
                            setAccordionState={setAccordionState}
                            parentKey={accordionKey}
                        />
                    </Accordion>
                </div>
            </div>
        </div>
    );
}

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

function getSavedAccordionState() {
    if (typeof window === "undefined") {
        return {};
    }

    try {
        const saved = JSON.parse(
            window.localStorage.getItem(STORAGE_KEY) || "{}"
        );

        return saved &&
            typeof saved === "object" &&
            !Array.isArray(saved)
            ? saved
            : {};
    } catch {
        return {};
    }
}

function getAccordionKey(menu, parentKey = "root", index = 0) {
    const identity =
        menu.id ??
        menu.key ??
        menu.category ??
        menu.title ??
        index;

    return `${parentKey}/${String(identity)}`;
}

function hasActiveChild(menu, pathname) {
    if (!hasCategory(menu)) {
        return Boolean(
            menu.to &&
            (
                pathname === menu.to ||
                pathname.startsWith(`${menu.to}/`)
            )
        );
    }

    return (
        menu.menus?.some((child) =>
            hasActiveChild(child, pathname)
        ) ?? false
    );
}

/**
 * Memantau kelas .hide pada elemen induk Nav.
 *
 * Contoh struktur:
 * <div className={isHidden ? "col-12 hide" : "col-12"}>
 *     <Nav menus={menus} nav />
 * </div>
 */
function useNavHidden(navRef) {
    const [isHidden, setIsHidden] = useState(false);

    useEffect(() => {
        const element = navRef.current;

        if (!element) {
            return;
        }

        // Ambil elemen Nav dan seluruh elemen induknya.
        const ancestors = [];
        let current = element;

        while (current && current !== document.body) {
            ancestors.push(current);
            current = current.parentElement;
        }

        const checkHidden = () => {
            setIsHidden(
                ancestors.some((item) =>
                    item.classList.contains("hide")
                )
            );
        };

        checkHidden();

        // Amati perubahan kelas, termasuk penambahan/penghapusan .hide.
        const observer = new MutationObserver(checkHidden);

        ancestors.forEach((item) => {
            observer.observe(item, {
                attributes: true,
                attributeFilter: ["class"],
            });
        });

        return () => {
            observer.disconnect();
        };
    }, [navRef]);

    return isHidden;
}

const Nav = forwardRef(function Nav(
    {
        menus,
        nav = true,
    },
    ref
) {
    const navRef = useRef(null);

    const isWide = useIsWide(576);
    const isNavHidden = useNavHidden(navRef);

    const [tooltipsEnabled, setTooltipsEnabled] = useState(false);

    const [accordionState, setAccordionState] = useState(
        getSavedAccordionState
    );

    /*
     * nav = true:
     * Tooltip otomatis muncul ketika sidebar memiliki kelas .hide.
     *
     * nav = false:
     * Tooltip tidak otomatis muncul saat sidebar disembunyikan.
     *
     * tooltipsEnabled tetap dapat dikontrol melalui ref.
     */
    const showTooltips = isWide && (
        tooltipsEnabled ||
        (nav && isNavHidden)
    );

    // Simpan status accordion.
    useEffect(() => {
        try {
            window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(accordionState)
            );
        } catch {
            // localStorage tidak tersedia.
        }
    }, [accordionState]);

    // API kontrol melalui ref.
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

            getNavHiddenState() {
                return isNavHidden;
            },

            openAccordion(key) {
                setAccordionState((current) => ({
                    ...current,
                    [key]: true,
                }));
            },

            closeAccordion(key) {
                setAccordionState((current) => ({
                    ...current,
                    [key]: false,
                }));
            },

            toggleAccordion(key) {
                setAccordionState((current) => ({
                    ...current,
                    [key]: !(current[key] ?? false),
                }));
            },

            setAccordion(key, isOpen) {
                setAccordionState((current) => ({
                    ...current,
                    [key]: Boolean(isOpen),
                }));
            },

            getAccordionState() {
                return accordionState;
            },

            resetAccordionState() {
                setAccordionState({});
            },
        }),
        [
            tooltipsEnabled,
            accordionState,
            isNavHidden,
        ]
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

        const instances = Array.from(elements).map((element) => {
            const instance =
                window.bootstrap.Tooltip.getOrCreateInstance(
                    element,
                    {
                        html: false,
                        placement:
                            element.dataset.bsPlacement || "right",
                    }
                );

            return instance;
        });

        return () => {
            instances.forEach((instance) => instance.dispose());
        };
    }, [
        showTooltips,
        menus,
        accordionState,
    ]);

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
        <div
            className="accordion"
            id={`accordion-${accordionId}`}
        >
            {children}
        </div>
    );
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

                const tooltipTitle =
                    typeof menu.title === "string"
                        ? menu.title
                        : typeof menu.label === "string"
                            ? menu.label
                            : "";

                const commonProps = {
                    style: {
                        "--depth": depth,
                    },

                    "data-bs-title": showTooltips
                        ? tooltipTitle
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

function AccordionCategory({
    menu,
    depth,
    showTooltips,
    accordionKey,
    accordionState,
    setAccordionState,
}) {
    const collapseRef = useRef(null);
    const collapseInstanceRef = useRef(null);

    const collapseId = useId();
    const headerId = useId();

    const safeCollapseId =
        `collapse-${collapseId.replace(/:/g, "")}`;

    const safeHeaderId =
        `header-${headerId.replace(/:/g, "")}`;

    const { pathname } = useLocation();

    const hasSavedState = Object.prototype.hasOwnProperty.call(
        accordionState,
        accordionKey
    );

    const isOpen = hasSavedState
        ? Boolean(accordionState[accordionKey])
        : hasActiveChild(menu, pathname);

    // Buat satu instance Collapse untuk setiap kategori.
    useEffect(() => {
        const element = collapseRef.current;
        const Collapse = window.bootstrap?.Collapse;

        if (!element || !Collapse) {
            return;
        }

        const instance = Collapse.getOrCreateInstance(element, {
            toggle: false,
        });

        collapseInstanceRef.current = instance;

        return () => {
            instance.dispose();

            if (collapseInstanceRef.current === instance) {
                collapseInstanceRef.current = null;
            }
        };
    }, []);

    // React mengontrol status; Bootstrap menangani animasi.
    useEffect(() => {
        const instance = collapseInstanceRef.current;

        if (!instance) {
            return;
        }

        if (isOpen) {
            instance.show();
        } else {
            instance.hide();
        }
    }, [isOpen]);

    function toggleAccordion() {
        setAccordionState((current) => {
            const currentlyOpen =
                Object.prototype.hasOwnProperty.call(
                    current,
                    accordionKey
                )
                    ? Boolean(current[accordionKey])
                    : hasActiveChild(menu, pathname);

            return {
                ...current,
                [accordionKey]: !currentlyOpen,
            };
        });
    }

    const tooltipTitle =
        typeof menu.title === "string"
            ? menu.title
            : typeof menu.category === "string"
                ? menu.category
                : "";

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
                            ? tooltipTitle
                            : undefined
                    }
                    data-bs-placement="right"
                    style={{
                        "--depth": depth,
                    }}
                >
                    {menu.label}
                </button>
            </h2>

            <div
                ref={collapseRef}
                id={safeCollapseId}
                className="accordion-collapse collapse"
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

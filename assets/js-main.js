// GLOBAL COMPONENTS
class ComponentAccordion extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this.addEventListener("click", this.handleClick.bind(this));
		this.refreshAccordion = this.refreshAccordion.bind(this);

		if (this.classList.contains("is-active")) {
			this.expandAccordion(this);
		}
	}

	disconnectedCallback() {
		this.removeEventListener("click", this.handleClick);
	}

	refreshAccordion(accordion) {
		const content = accordion.querySelector(".js-accordion-content");
		this.adjustHeight(content, accordion.classList.contains("is-active"));
	}

	handleClick(e) {
		const toggle = e.target.closest(".js-accordion-toggle");
		if (!toggle) return;

		const accordion = toggle.closest(".c-accordion");
		const closeSiblings = accordion.classList.contains("is-close-siblings");
		this.toggleAccordion(accordion, closeSiblings);
	}

	toggleAccordion(accordion, closeSiblings) {
		if (!accordion) return;

		const isActive = accordion.classList.contains("is-active");

		if (closeSiblings) {
			getSiblings(accordion).forEach((item) => {
				if (item.classList.contains("is-active")) this.collapseAccordion(item);
			});
		}

		isActive
			? this.collapseAccordion(accordion)
			: this.expandAccordion(accordion);
	}

	expandAccordion(accordion) {
		const content = accordion.querySelector(".js-accordion-content");
		if (!content) return;

		accordion.classList.add("is-active");
		accordion.setAttribute("aria-expanded", true);
		content.setAttribute("aria-hidden", false);

		this.adjustHeight(content, true);
	}

	collapseAccordion(accordion) {
		const content = accordion.querySelector(".js-accordion-content");
		if (!content) return;

		accordion.classList.remove("is-active");
		accordion.setAttribute("aria-expanded", false);
		content.setAttribute("aria-hidden", true);

		this.adjustHeight(content, false);
	}

	adjustHeight(wrapperEl, isOpening) {
		if (!wrapperEl) return;

		const clear = () => {
			wrapperEl.style.height = isOpening ? "auto" : "";
			wrapperEl.removeEventListener("transitionend", clear);
		};

		if (isOpening) {
			wrapperEl.style.height = "0";
			wrapperEl.offsetHeight;
			wrapperEl.style.height = wrapperEl.scrollHeight + "px";
		} else {
			wrapperEl.style.height = wrapperEl.scrollHeight + "px";
			wrapperEl.offsetHeight;
			wrapperEl.style.height = "0";
		}

		wrapperEl.addEventListener("transitionend", clear);
	}
}
customElements.define("c-accordion", ComponentAccordion);

class ComponentSlider extends HTMLElement {
	constructor() {
		super();
		this.viewportNode = this.querySelector(".js-embla-viewport");
		this.prevButtonNode = this.querySelector(".js-embla-button-prev");
		this.nextButtonNode = this.querySelector(".js-embla-button-next");
		this.dotsNode = this.querySelector(".js-embla-dots");
		this.progressNode = this.querySelector(".js-progress-bar");
		this.slideCardNodes = this.querySelectorAll(".c-slider__slide");
		this.isVertical = this.dataset.emblaVertical === "true";

		// Initialize features
		this.enableSync = this.dataset.emblaSync === "true";
		this.enableClickToSlide = this.dataset.emblaClickToSlide === "true";

		// Plugins
		this.enableWheel = this.dataset.emblaWheel === "true";
		this.enableFade = this.dataset.emblaFade === "true";
		this.enableAutoHeight = this.dataset.emblaAutoHeight === "true";
		this.enableAutoplay = this.dataset.emblaAutoplay === "true";
		const autoplayDelay = this.hasAttribute("data-embla-delay")
			? parseInt(this.dataset.emblaDelay)
			: 4000;
		const autoplay = EmblaCarouselAutoplay({
			playOnInit: this.enableAutoplay,
			delay: autoplayDelay,
			stopOnInteraction: false,
			stopOnMouseEnter: true,
		});
		this.enableAutoScroll = this.dataset.emblaAutoScroll === "true";
		const autoScrollSpeed = this.hasAttribute("data-embla-scroll-speed")
			? parseInt(this.dataset.emblaScrollSpeed)
			: 2;
		const autoScrollDelay = this.hasAttribute("data-embla-scroll-delay")
			? parseInt(this.dataset.emblaScrollDelay)
			: 0;
		const autoScrollDirection =
			this.dataset.emblaScrollBackward === "true" ? "backward" : "forward";
		const autoScroll = EmblaCarouselAutoScroll({
			playOnInit: this.enableAutoScroll,
			speed: autoScrollSpeed,
			startDelay: autoScrollDelay,
			direction: autoScrollDirection,
			stopOnInteraction: false,
			stopOnMouseEnter: false,
		});

		const plugins = [
			EmblaCarouselClassNames(),
			...(this.enableWheel ? [EmblaCarouselWheelGestures()] : []),
			...(this.enableAutoplay ? [autoplay] : []),
			...(this.enableAutoplay ? [autoplay] : []),
			...(this.enableAutoScroll ? [autoScroll] : []),
			...(this.enableFade ? [EmblaCarouselFade()] : []),
			...(this.enableAutoHeight ? [EmblaCarouselAutoHeight()] : []),
		];

		const options = {
			axis: this.isVertical ? "y" : "x",
			...JSON.parse(this.dataset.emblaSlider.replace(/'/g, '"').trim()),
		};
		if (vs.isTouchDevice && this.closest(".s-data__blocks")) {
			options.watchDrag = false;
		}

		// Init Embla
		this.embla = EmblaCarousel(this.viewportNode, options, plugins);
		// destroy embla if contains only one item
		this.slideNodes = this.embla.slideNodes();
		if (this.slideNodes.length === 1) {
			this.classList.add("is-inactive");
			this.embla.destroy();
		}
	}

	connectedCallback() {
		this.initializeNavigation();
	}

	// Prev & Next Buttons
	addTogglePrevNextBtnsActive = (emblaApi, prevBtn, nextBtn) => {
		const togglePrevNextBtnsState = () => {
			if (emblaApi.canScrollPrev()) prevBtn.removeAttribute("disabled");
			else prevBtn.setAttribute("disabled", "disabled");

			if (emblaApi.canScrollNext()) nextBtn.removeAttribute("disabled");
			else nextBtn.setAttribute("disabled", "disabled");
		};

		emblaApi
			.on("select", togglePrevNextBtnsState)
			.on("init", togglePrevNextBtnsState)
			.on("reInit", togglePrevNextBtnsState);

		return () => {
			prevBtn.removeAttribute("disabled");
			nextBtn.removeAttribute("disabled");
		};
	};
	addPrevNextBtnsClickHandlers = (emblaApi, prevBtn, nextBtn) => {
		const scrollPrev = () => {
			emblaApi.scrollPrev();
		};
		const scrollNext = () => {
			emblaApi.scrollNext();
		};
		prevBtn.addEventListener("click", scrollPrev, false);
		nextBtn.addEventListener("click", scrollNext, false);

		const removeTogglePrevNextBtnsActive = this.addTogglePrevNextBtnsActive(
			emblaApi,
			prevBtn,
			nextBtn
		);

		return () => {
			removeTogglePrevNextBtnsActive();
			prevBtn.removeEventListener("click", scrollPrev, false);
			nextBtn.removeEventListener("click", scrollNext, false);
		};
	};

	// Dots
	addDotBtnsAndClickHandlers = (emblaApi, dotsNode) => {
		let dotNodes = [];

		const addDotBtnsWithClickHandlers = () => {
			dotsNode.innerHTML = emblaApi
				.scrollSnapList()
				.map(
					(el, i) =>
						`<button class="embla__dot c-slider__dot increase-target-size" type="button" data-trigger-sync=${i} aria-label="Jump to slide ${i}"></button>`
				)
				.join("");

			const scrollTo = (index) => {
				emblaApi.scrollTo(index);
			};

			dotNodes = Array.from(dotsNode.querySelectorAll(".embla__dot"));

			dotNodes.forEach((dotNode, index) => {
				dotNode.addEventListener("click", () => scrollTo(index), false);
			});
		};

		const toggleDotBtnsActive = () => {
			const previous = emblaApi.previousScrollSnap();
			const selected = emblaApi.selectedScrollSnap();
			dotNodes[previous].classList.remove("is-active");
			dotNodes[selected].classList.add("is-active");
		};

		const dotsDisplay = () => {
			const emblaEngine = emblaApi.internalEngine();
			if (dotNodes.length <= 1) {
				this.dotsNode.classList.add("is-hidden");
				this.viewportNode.classList.remove("is-draggable");
				emblaEngine.dragHandler.destroy();
			} else {
				this.dotsNode.classList.remove("is-hidden");
				this.viewportNode.classList.add("is-draggable");
				emblaEngine.dragHandler.init();
			}
		};

		emblaApi
			.on("init", addDotBtnsWithClickHandlers)
			.on("reInit", addDotBtnsWithClickHandlers)
			.on("init", toggleDotBtnsActive)
			.on("reInit", toggleDotBtnsActive)
			.on("select", toggleDotBtnsActive)
			.on("reInit", dotsDisplay)
			.on("init", dotsDisplay);

		return () => {
			dotsNode.innerHTML = "";
		};
	};

	addClickToSlideHandler = (emblaApi, slideCards) => {
		const scrollNext = () => emblaApi.scrollNext();

		slideCards.forEach((card) =>
			card.addEventListener("click", scrollNext, false)
		);

		return () => {
			slideCards.forEach((card) =>
				card.removeEventListener("click", scrollNext, false)
			);
		};
	};

	// Progress Bar
	setupProgressBar = (emblaApi, progressNode) => {
		const applyProgress = () => {
			const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
			progressNode.style.transform = `translate3d(${progress * 100}%,0px,0px)`;
		};

		const removeProgress = () => {
			progressNode.removeAttribute("style");
		};

		return {
			applyProgress,
			removeProgress,
		};
	};
	syncSliderWithTrigger = () => {};
	initializeNavigation = () => {
		if (this.slideNodes.length === 1) return;
		if (this.prevButtonNode && this.nextButtonNode) {
			const removePrevNextBtnsClickHandlers = this.addPrevNextBtnsClickHandlers(
				this.embla,
				this.prevButtonNode,
				this.nextButtonNode
			);
			this.embla.on("destroy", removePrevNextBtnsClickHandlers);
		}

		if (this.progressNode) {
			const { applyProgress, removeProgress } = this.setupProgressBar(
				this.embla,
				this.progressNode
			);

			this.embla
				.on("init", applyProgress)
				.on("reInit", applyProgress)
				.on("scroll", applyProgress)
				.on("slideFocus", applyProgress)
				.on("destroy", removeProgress);
		}

		if (this.dotsNode) {
			const removeDotBtnsAndClickHandlers = this.addDotBtnsAndClickHandlers(
				this.embla,
				this.dotsNode
			);
			this.embla.on("destroy", removeDotBtnsAndClickHandlers);
		}

		if (this.enableClickToSlide) {
			const removeClickToSlideHandler = this.addClickToSlideHandler(
				this.embla,
				this.slideCardNodes
			);
			this.embla.on("destroy", removeClickToSlideHandler);
		}

		//Sync element triggers /discovery page origin section
		if (this.enableSync) {
			this.embla.on("select", () => {
				const trigger = this.dotsNode.querySelector(".c-slider__dot.is-active");
				const parent = trigger.closest(".js-slider-sync");

				if (trigger) {
					const triggerEl = parent.querySelector(
						`[data-trigger="${trigger.dataset.triggerSync}"]`
					);
					const targetEl = parent.querySelector(
						`[data-target="${trigger.dataset.triggerSync}"]`
					);
					getSiblings(triggerEl).forEach((item) => {
						item.classList.remove("is-active");
					});
					getSiblings(targetEl).forEach((item) => {
						item.classList.remove("is-active");
					});
					triggerEl.classList.add("is-active");
					targetEl.classList.add("is-active");

					if (triggerEl.parentElement) {
						triggerEl.parentElement.scrollLeft = triggerEl.offsetLeft - 40;
					}
				}
			});

			on("body", "click", ".js-slider-sync [data-trigger]", (e) => {
				const triggerValue = e.target.closest("[data-trigger]").dataset.trigger;
				this.embla.scrollTo(parseInt(triggerValue));
			});
		}
	};
}
customElements.define("c-slider", ComponentSlider);

const globalOverlay = document.querySelector(".js-g-overlay");
const globalPopup = document.querySelector(".js-g-popup");

const initHeader = () => {
	const mobileMenu = document.querySelector(".js-mobile-menu");

	const toggleMobileMenu = (isActive = false) => {
		root.classList.toggle("is-mobile-menu-active", isActive);
		mobileMenu.classList.toggle("is-active", isActive);
		mobileMenu.setAttribute("aria-hidden", !isActive);
	};

	const toggleOverlay = (isActive = false) => {
		globalOverlay.setAttribute("tabindex", isActive ? 0 : -1);
		globalOverlay.setAttribute("aria-hidden", !isActive);
	};

	on("body", "click", ".js-mobile-menu-toggle", (e) => {
		const isMobileMenuActive = !root.classList.contains(
			"is-mobile-menu-active"
		);

		// scrollDisable();
		toggleMobileMenu(isMobileMenuActive);
		toggleOverlay(isMobileMenuActive);

		if (!isMobileMenuActive) {
			toggleOverlay();
			// scrollEnable();
		}
	});

	// window.addEventListener("scroll", () => {
	// 	const shrinkHeaderThreshold = 30;
	// 	root.classList.toggle(
	// 		"is-header-shrink",
	// 		window.scrollY > shrinkHeaderThreshold
	// 	);
	// });
};

const playTargetVideo = (
	video,
	externalVideoType,
	player,
	soundOn = false,
	videoHasMuteBtn = false
) => {
	const playVideo = (video) => {
		const doPlay = () => {
			video.muted = !(videoHasMuteBtn && soundOn);
			const playPromise = video.play();
			if (playPromise) {
				playPromise.catch((error) => {
					if (error.name !== "AbortError") {
						console.error("Play error:", error);
					}
				});
			}
		};

		if (video.readyState >= 3) {
			doPlay();
		} else {
			video.addEventListener(
				"canplay",
				() => {
					doPlay();
				},
				{ once: true }
			);
		}
	};

	const playExternalVideo = (player, externalVideoType) => {
		if (externalVideoType === "vimeo") {
			if (player && typeof player.play === "function") {
				const shouldMute = !(videoHasMuteBtn && soundOn);
				player
					.setMuted(shouldMute)
					.then(() => {
						return player.play();
					})
					.catch((error) => {
						if (error.name !== "PlayInterrupted") {
							console.error("Error playing Vimeo video:", error);
						}
					});
			} else {
				console.warn(
					"Vimeo player not fully initialized or play methods unavailable."
				);
			}
		} else if (externalVideoType === "youtube") {
			// Both functions existing means the YouTube player is fully initialized.
			if (
				typeof player.playVideo == "function" &&
				typeof player.mute === "function"
			) {
				videoHasMuteBtn && soundOn ? player.unMute() : player.mute();
				player.playVideo();
			} else {
				console.warn(
					"YouTube player not fully initialized or methods unavailable."
				);
			}
		}
	};

	if (video) {
		playVideo(video);
	} else if (player) {
		playExternalVideo(player, externalVideoType);
	}
};

const pauseTargetVideo = (video, externalVideoType, player) => {
	const pauseVideo = (video) => {
		video.pause();
		video.muted = true;
	};

	const pauseExternalVideo = (player, externalVideoType) => {
		if (externalVideoType === "vimeo") {
			if (player && typeof player.pause === "function") {
				player
					.pause()
					.then(() => {
						return player.setMuted(true);
					})
					.catch((error) => {
						if (error.name !== "PlayInterrupted") {
							console.error("Error pausing Vimeo video:", error);
						}
					});
			} else {
				console.warn(
					"Vimeo player not fully initialized or pause methods unavailable."
				);
			}
		} else if (externalVideoType === "youtube") {
			// Both functions existing means the YouTube player is fully initialized.
			if (
				typeof player.pauseVideo === "function" &&
				typeof player.mute === "function"
			) {
				player.pauseVideo();
				player.mute();
			} else {
				console.warn(
					"YouTube player not fully initialized or methods unavailable."
				);
			}
		}
	};

	if (video) {
		pauseVideo(video);
	} else if (player) {
		pauseExternalVideo(player, externalVideoType);
	}
};

function hasAudio(video) {
	return (
		video.mozHasAudio ||
		Boolean(video.webkitAudioDecodedByteCount) ||
		Boolean(video.audioTracks?.length)
	);
}
function hasVideoGotAudio(src) {
	return new Promise((resolve, reject) => {
		// create a new <video> element without affecting any existing video player on the page
		const video = Object.assign(document.createElement("video"), {
			muted: true,
			crossOrigin: "anonymous",
			preload: "auto",
			src,
		});

		video.addEventListener("error", () => reject("Video load error"), {
			once: true,
		});

		video.addEventListener(
			"canplay",
			() => {
				// Prevent seeking past duration
				video.currentTime = Math.min(video.duration || 1, 0.99);
			},
			{ once: true }
		);

		video.addEventListener(
			"seeked",
			() => {
				resolve(
					video.mozHasAudio ||
						Boolean(video.webkitAudioDecodedByteCount) ||
						Boolean(video.audioTracks?.length)
				);
			},
			{ once: true }
		);
	});
}

async function checkVimeoAudio(videoId) {
	try {
		// Use Vimeo oEmbed API to get video information
		const response = await fetch(
			`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`
		);
		const data = await response.json();

		if (data.duration && data.duration > 5) {
			return true; // Assume videos longer than 5 seconds have audio
		}

		// Check if the video has a description that might indicate it's a GIF or silent
		const title = data.title?.toLowerCase() || "";
		const description = data.description?.toLowerCase() || "";

		if (
			title.includes("gif") ||
			title.includes("silent") ||
			description.includes("no audio") ||
			description.includes("silent")
		) {
			return false;
		}

		return true;
	} catch (error) {
		console.warn("Could not fetch Vimeo video info:", error);
		return true;
	}
}

const handleVideoPlayback = (item, play, targetPlayer) => {
	const videoElement = item.querySelector("video");
	const externalVideo = item.querySelector(".js-external-video");
	const externalVideoType = externalVideo?.dataset.videoHost;
	const videoHasMuteBtn = item.querySelector(
		".js-video-mute.is-active, .js-video-unmute.is-active"
	);
	const soundOn = videoHasMuteBtn?.classList.contains("js-video-mute");

	if (!videoElement && !targetPlayer) {
		return;
	}

	if (play) {
		playTargetVideo(
			videoElement,
			externalVideoType,
			targetPlayer,
			soundOn,
			videoHasMuteBtn
		);
	} else {
		pauseTargetVideo(videoElement, externalVideoType, targetPlayer);
	}
};

const handleVideoVisibility = (isVisible, item) => {
	const isAutoplay = item.classList.contains("is-autoplay");
	const shouldPlay = isAutoplay && isVisible;

	// Use the unique ID, not original video ID
	const externalVideoId =
		item.querySelector(".js-external-video")?.dataset.videoId;
	const targetPlayer = allPlayersObj[externalVideoId];

	handleVideoPlayback(item, shouldPlay, targetPlayer);

	// Hide all video buttons
	item
		.querySelectorAll(
			".js-video-mute, .js-video-unmute, .js-video-play, .js-video-pause"
		)
		.forEach((button) => button.classList.remove("is-active"));
	// Reset play/pause buttons
	if (isVisible) {
		item
			.querySelector(isAutoplay ? ".js-video-pause" : ".js-video-play")
			?.classList.add("is-active");
	}
	//Reset sound control buttons if audio exist
	const sources = item.querySelectorAll("video source");
	const mp4Source = Array.from(sources).find(
		(source) => source.type === "video/mp4" && source.dataset?.src
	);
	const videoSrc = mp4Source?.dataset?.src;
	// Check for Vimeo iframe
	const vimeoIframe = item.querySelector('iframe[data-video-host="vimeo"]');

	// Handle MP4 videos
	if (videoSrc && /\.mp4($|\?)/.test(videoSrc)) {
		hasVideoGotAudio(videoSrc)
			.then((result) => {
				if (result === true && isVisible) {
					item.querySelector(".js-video-unmute")?.classList.add("is-active");
				}
			})
			.catch((err) => {
				console.warn("Audio detection error:", err);
			});
	}
	// Handle Vimeo videos
	else if (vimeoIframe) {
		const hasAudio = vimeoIframe.dataset.videoAudio === "true";
		hasAudio && isVisible
			? item.querySelector(".js-video-unmute")?.classList.add("is-active")
			: "";
	}
};

const loadLazyVideo = (videoEl) => {
	if (videoEl.dataset.loaded) return;

	const sources = videoEl.querySelectorAll("source");
	sources.forEach((source) => {
		if (!source.src && source.dataset.src) {
			source.src = source.dataset.src;
		}
	});

	if (videoEl.readyState === 0) {
		videoEl.load();
		videoEl.dataset.loaded = "true";
	}
};

const initVideo = () => {
	// always play/pause video if section is in view
	document.querySelectorAll(".c-video").forEach((item) => {
		const observer = new IntersectionObserver(
			([entry]) => {
				handleVideoVisibility(entry.isIntersecting, item);

				if (entry.isIntersecting) {
					const lazyVideo = item.querySelector("video.js-lazy-video");
					lazyVideo && loadLazyVideo(lazyVideo);
				}
			},
			{ root: null, threshold: [0.4] }
		);
		observer.observe(item);
	});

	const handleVideoControl = (e, action) => {
		const target = e.target.closest(`.js-video-${action}`);
		const videoContainer = target.closest(".c-video");
		const videoElement = videoContainer.querySelector("video");
		const externalVideo = videoContainer.querySelector(".js-external-video");
		const videoHasMuteBtn = videoContainer.querySelector(
			".js-video-mute.is-active, .js-video-unmute.is-active"
		);
		const soundOn = videoHasMuteBtn?.classList.contains("js-video-mute");
		const externalVideoType = externalVideo?.dataset.videoHost;
		const externalVideoId = externalVideo?.dataset.videoId; // Unique ID
		const targetPlayer = allPlayersObj[externalVideoId];

		if (action === "play") {
			playTargetVideo(
				videoElement,
				externalVideoType,
				targetPlayer,
				soundOn,
				videoHasMuteBtn
			);
		} else if (action === "pause") {
			pauseTargetVideo(videoElement, externalVideoType, targetPlayer);
		} else if (action === "mute" || action === "unmute") {
			if (externalVideoType === "youtube") {
				if (typeof targetPlayer.unMute == "function") {
					targetPlayer.isMuted() ? targetPlayer.unMute() : targetPlayer.mute();
				} else {
					console.warn(
						"YouTube player not fully initialized or methods unavailable."
					);
				}
			} else if (externalVideoType === "vimeo") {
				if (targetPlayer && typeof targetPlayer.getMuted === "function") {
					targetPlayer
						.getMuted()
						.then((muted) => {
							return targetPlayer.setMuted(!muted);
						})
						.catch((error) => {
							console.error("Error toggling Vimeo mute:", error);
						});
				} else {
					console.warn(
						"Vimeo player not fully initialized or getMuted methods unavailable."
					);
				}
			} else if (videoElement) {
				videoElement.muted = action === "mute" ? true : false;
			}
		}

		// Toggle play/pause or mute/unmute button visibility
		if (action === "play" || action === "pause") {
			target.classList.remove("is-active");
			videoContainer
				.querySelector(`.js-video-${action === "play" ? "pause" : "play"}`)
				?.classList.add("is-active");
		} else if (action === "mute" || action === "unmute") {
			videoContainer
				.querySelector(".js-video-mute")
				?.classList.toggle("is-active", action === "unmute");
			videoContainer
				.querySelector(".js-video-unmute")
				?.classList.toggle("is-active", action === "mute");
		}
	};

	on("body", "click", ".js-video-mute", (e) => handleVideoControl(e, "mute"));
	on("body", "click", ".js-video-unmute", (e) =>
		handleVideoControl(e, "unmute")
	);
	on("body", "click", ".js-video-play", (e) => handleVideoControl(e, "play"));
	on("body", "click", ".js-video-pause", (e) => handleVideoControl(e, "pause"));
};

// For Vimeo videos
const handlePopupClose = () => {
	document
		.querySelectorAll(
			'[data-popup-target] .js-external-video[data-video-host="vimeo"]'
		)
		.forEach((iframe) => {
			const externalVideoId = iframe.dataset.videoId;
			const player = allPlayersObj[externalVideoId];

			if (player && typeof player.pause === "function") {
				player
					.pause()
					.then(() => {
						return player.setCurrentTime(0);
					})
					.then(() => {
						return player.setMuted(true);
					})
					.catch((error) => {
						console.warn("Error resetting Vimeo video:", error);
					});
			}
		});
};

const handlePopupOpen = () => {
	const popupIframe = document.querySelector(
		'.g-popup .js-external-video[data-video-host="vimeo"]'
	);

	if (popupIframe) {
		const externalVideoId = popupIframe.dataset.videoId;

		try {
			const player = new Vimeo.Player(popupIframe);

			player
				.ready()
				.then(() => {
					allPlayersObj[externalVideoId] = player;
				})
				.catch((error) => {
					console.error("Vimeo player ready error:", error);
				});
		} catch (error) {
			console.error("Error creating Vimeo player:", error);
		}
	}
};

document.addEventListener("click", (e) => {
	if (e.target.matches("[data-popup-close]")) {
		handlePopupClose();
	} else if (e.target.closest("[data-popup-trigger]")) {
		handlePopupOpen();
	}
});

const initPDP = () => {
	const productHero = document.querySelector(".product-hero");

	const initCollapsibleSellingPlan = () => {
		const containers = document.querySelectorAll(
			"[data-selling-plan-container]"
		);

		function animateHeight(element, targetHeight, duration = 300) {
			return new Promise((resolve) => {
				const computedStyle = window.getComputedStyle(element);
				let startHeight;

				if (
					computedStyle.maxHeight === "none" ||
					computedStyle.maxHeight === "0px"
				) {
					startHeight = element.scrollHeight;
				} else {
					startHeight = parseFloat(computedStyle.maxHeight);
				}

				if (isNaN(startHeight) || startHeight < 0) {
					startHeight = element.scrollHeight;
				}

				const startTime = performance.now();

				function animate(currentTime) {
					const elapsed = currentTime - startTime;
					const progress = Math.min(elapsed / duration, 1);
					const easeOutQuart = 1 - Math.pow(1 - progress, 4);
					const currentHeight =
						startHeight + (targetHeight - startHeight) * easeOutQuart;

					element.style.maxHeight = currentHeight + "px";

					if (progress < 1) {
						requestAnimationFrame(animate);
					} else {
						if (targetHeight > 0) {
							element.style.maxHeight = "none";
						}
						resolve();
					}
				}

				requestAnimationFrame(animate);
			});
		}

		function handleOptionToggle(container, selectedValue) {
			const allOptions = container.querySelectorAll(
				"[data-selling-plan-option]"
			);

			allOptions.forEach((option) => {
				const optionType = option.getAttribute("data-selling-plan-option");
				const content = option.querySelector("[data-collapsible-content]");
				const frequencySelect = option.querySelector(
					'select[name="selling_plan"]'
				);

				if (optionType === selectedValue) {
					// Expand option
					option.classList.add("is-expanded");
					if (content) {
						const targetHeight = content.scrollHeight;
						animateHeight(content, targetHeight);
					}
					if (frequencySelect) frequencySelect.disabled = false;
				} else {
					// Collapse option
					option.classList.remove("is-expanded");
					if (content) {
						animateHeight(content, 0);
					}
					if (frequencySelect) frequencySelect.disabled = true;
				}
			});
		}

		function initializeState(container) {
			const checkedRadio = container.querySelector(
				'input[type="radio"]:checked'
			);
			const checkedCheckboxes = container.querySelectorAll(
				'input[type="checkbox"]:checked'
			);

			const allOptions = container.querySelectorAll(
				"[data-selling-plan-option]"
			);
			allOptions.forEach((option) => {
				const content = option.querySelector("[data-collapsible-content]");
				if (content) {
					content.style.maxHeight = "0px";
				}
				option.classList.remove("is-expanded");
			});

			if (checkedRadio) {
				handleOptionToggle(container, checkedRadio.value);
			}

			checkedCheckboxes.forEach((checkbox) => {
				const option = container.querySelector(
					`[data-selling-plan-option="${checkbox.value}"]`
				);
				if (option) {
					const content = option.querySelector("[data-collapsible-content]");
					const frequencySelect = option.querySelector(
						'select[name="selling_plan"]'
					);

					option.classList.add("is-expanded");
					if (content) {
						content.style.maxHeight = "none";
						const targetHeight = content.scrollHeight;
						content.style.maxHeight = targetHeight + "px";
					}
					if (frequencySelect) frequencySelect.disabled = false;
				}
			});

			if (!checkedRadio && checkedCheckboxes.length === 0) {
				allOptions.forEach((option) => {
					const content = option.querySelector("[data-collapsible-content]");
					const frequencySelect = option.querySelector(
						'select[name="selling_plan"]'
					);

					option.classList.remove("is-expanded");
					if (content) content.style.maxHeight = "0px";
					if (frequencySelect) frequencySelect.disabled = true;
				});
			}
		}

		containers.forEach((container) => {
			const radioInputs = container.querySelectorAll('input[type="radio"]');
			const checkboxInputs = container.querySelectorAll(
				'input[type="checkbox"]'
			);

			radioInputs.forEach((radio) => {
				radio.addEventListener("change", function () {
					if (this.checked) {
						handleOptionToggle(container, this.value);
					}
				});
			});

			checkboxInputs.forEach((checkbox) => {
				checkbox.addEventListener("change", function () {
					const option = container.querySelector(
						`[data-selling-plan-option="${this.value}"]`
					);
					const content = option.querySelector("[data-collapsible-content]");
					const frequencySelect = option.querySelector(
						'select[name="selling_plan"]'
					);

					if (this.checked) {
						option.classList.add("is-expanded");
						if (content) {
							const targetHeight = content.scrollHeight;
							animateHeight(content, targetHeight);
						}
						if (frequencySelect) frequencySelect.disabled = false;
					} else {
						option.classList.remove("is-expanded");
						if (content) animateHeight(content, 0);
						if (frequencySelect) frequencySelect.disabled = true;
					}
				});
			});

			initializeState(container);
		});
	};
	// Init collapsible selling plan functionality
	initCollapsibleSellingPlan();

	// purchase bar
	const purchaseBar = document.querySelector(".js-purchase-bar");

	// show purchase bar
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					purchaseBar.classList.remove("is-visible");
				} else {
					purchaseBar.classList.add("is-visible");
				}
			});
		},
		{
			root: null,
			threshold: 0.1,
			rootMargin: "-70% 0px 0px 0px",
		}
	);

	observer.observe(productHero);

	if (purchaseBar) {
		const syncSellingPlanInfo = () => {
			// clone info
			const subscriptionInfo = productHero.querySelector(
				".js-subscription-info"
			);

			if (subscriptionInfo) {
				const cloneInfo = subscriptionInfo.cloneNode(true);
				const syncSubscription = purchaseBar.querySelector(
					".js-sync-subscription"
				);
				syncSubscription?.appendChild(cloneInfo);
			}

			const oneTimeInfo = productHero.querySelector(".js-one-time-info");
			if (oneTimeInfo) {
				const cloneInfo = oneTimeInfo.cloneNode(true);
				const syncSubscription = purchaseBar.querySelector(".js-sync-one-time");
				syncSubscription?.appendChild(cloneInfo);
			}
		};
		syncSellingPlanInfo();

		// sync selling plan options
		const syncSubscriptionInput = purchaseBar.querySelector(
			".js-sync-subscription input"
		);
		const syncOneTimeInput = purchaseBar.querySelector(
			".js-sync-one-time input"
		);
		// update purchase bar options
		on("body", "change", "[data-selling-plan-option]", (e) => {
			const plan = e.target.closest("[data-selling-plan-option]")?.dataset
				.sellingPlanOption;

			if (plan === "subscription") {
				syncSubscriptionInput.checked = true;
				syncOneTimeInput.checked = false;
			} else if (plan === "one-time") {
				syncSubscriptionInput.checked = false;
				syncOneTimeInput.checked = true;
			}
		});

		// update product form inputs
		on(
			"body",
			"change",
			".js-sync-subscription input, .js-sync-one-time input",
			(e) => {
				const selectedPlan = e.target.value;

				document
					.querySelectorAll(
						`[data-selling-plan-option='${selectedPlan}'] input`
					)
					.forEach((input) => {
						if (!input.checked) input.click();
					});
			}
		);
	}
};

const initBenefitsAccordion = () => {
	const container = document.querySelector(".js-benefits-accordion-container");
	if (!container) return;
	const updateAccordionHeights = () => {
		// Loop through all and find max height
		const maxHeight = Math.max(
			...[...container.querySelectorAll(".c-accordion__toggle")].map(
				(accordion) => accordion.offsetHeight
			)
		);
		// Assign the max height to every accordion button
		[...container.querySelectorAll(".c-accordion")].forEach((accordion) => {
			accordion.style.minHeight = `${maxHeight}px`;
		});
	};
	updateAccordionHeights();
	const debouncedUpdateAccordionHeights = debounce(updateAccordionHeights, 200);

	window.addEventListener("resize", debouncedUpdateAccordionHeights);
};

// TODO: Review this logic — may be room for improvement
const initShareButton = () => {
	if (!vs.isTouchDevice) return;

	const shareButton = document.querySelector(".js-share-button");
	if (!shareButton) return;
	shareButton.classList.remove("is-hoverable");

	const shareContent = shareButton.querySelector(
		".article-content__hero__share__content"
	);

	shareButton.addEventListener("click", (e) => {
		e.preventDefault();
		e.stopPropagation(); // Prevent click from immediately bubbling to document
		shareContent.classList.toggle("is-active");
	});
	document.addEventListener("click", (e) => {
		if (
			shareContent.classList.contains("is-active") &&
			!shareButton.contains(e.target)
		) {
			shareContent.classList.remove("is-active");
		}
	});
};

// Load Vimeo / Youtube players
let allPlayersObj = {};
// youtube fix - lace this event at global level
window.onYouTubeIframeAPIReady = () => {
	document
		.querySelectorAll('.js-external-video[data-video-host="youtube"]')
		.forEach((video) => {
			const externalVideoId = video.dataset.videoId;
			const originalVideoId = video.dataset.originalVideoId;
			const player = new YT.Player(video, {
				videoId: originalVideoId,
				playerVars: { playsinline: 1 },
			});
			allPlayersObj[externalVideoId] = player;
		});
};

// Vimeo setup
window.addEventListener("load", () => {
	document
		.querySelectorAll('.js-external-video[data-video-host="vimeo"]')
		.forEach((video) => {
			const externalVideoId = video.dataset.videoId;

			if (Vimeo?.Player) {
				try {
					const player = new Vimeo.Player(video);

					player
						.ready()
						.then(() => {
							allPlayersObj[externalVideoId] = player;
						})
						.catch((error) => {
							console.error("Vimeo player ready error:", error);
						});
				} catch (error) {
					console.error("Error creating Vimeo player:", error);
				}
			} else {
				console.warn("Vimeo Player API not loaded");
			}
		});

	setTimeout(() => {
		// set a slight delay for player to load completely
		initVideo();
	}, 800);
});

const initArticleCount = () => {
	const elements = document.querySelectorAll(".js-article-read-time");
	if (elements && elements?.length > 0) {
		elements.forEach(function (el) {
			const content = el.dataset.content || "";
			const wordsPerMinute = 200;
			const wordCount = content.split(/\s+/).length;
			const readingTime = Math.max(1, Math.round(wordCount / wordsPerMinute));
			el.textContent = `${readingTime} min read`;
		});
	}
};

class CopyLinkButton extends HTMLElement {
	constructor() {
		super();
		this.handleClick = this.handleClick.bind(this);
	}

	connectedCallback() {
		this.textContent = this.textContent || "Link"; // fallback text
		this.addEventListener("click", this.handleClick);
	}

	disconnectedCallback() {
		this.removeEventListener("click", this.handleClick);
	}

	handleClick() {
		const originalText = this.textContent;

		navigator.clipboard
			.writeText(window.location.href)
			.then(() => {
				this.textContent = "Copied";
				setTimeout(() => {
					this.textContent = originalText;
				}, 500);
			})
			.catch((err) => {
				console.error("Failed to copy link:", err);
			});
	}
}
customElements.define("copy-link-btn", CopyLinkButton);

const initMatch = () => {
	function openTarget(trigger, isSiblingParent, isToggle) {
		//trigger remove and add active state
		getSiblings(trigger).forEach((item) => {
			item.classList.remove("is-active");
		});

		if (isToggle) {
			trigger.classList.toggle("is-active");
		} else {
			trigger.classList.add("is-active");
		}

		//find all matching targets
		let activeTarget = document.querySelector(
			`[data-target="${trigger.dataset.trigger}"]`
		);

		if (activeTarget) {
			if (isSiblingParent) {
				const targetParent = activeTarget.closest(".js-target-parent");

				getSiblings(targetParent).forEach((item) => {
					item.querySelector("[data-target]").classList.remove("is-active");
				});
			} else {
				getSiblings(activeTarget).forEach((item) => {
					item.classList.remove("is-active");
				});
			}

			if (isToggle) {
				activeTarget.classList.toggle("is-active");
			} else {
				activeTarget.classList.add("is-active");
			}
		}
	}

	//match navigation with content
	on("body", "click", "[data-trigger]", (e) => {
		let trigger = e.target.closest("[data-trigger]");
		const isSiblingParent = trigger.dataset.triggerParent === "true" || false;
		const isToggle = trigger.dataset.triggerToggle === "true" || false;
		openTarget(trigger, isSiblingParent, isToggle);
	});

	//only trigger parent
	on("body", "click", ".js-card-trigger", (e) => {
		const trigger = e.target.closest(".js-card-trigger");
		const target = trigger.closest(".js-card");

		target.classList.toggle("is-active");
	});

	document.addEventListener("click", function (event) {
		// Check if the click is outside any tooltip
		if (!event.target.closest(".js-target-parent")) {
			const tooltips = document.querySelectorAll(
				".js-target-parent [data-target]"
			);
			tooltips.forEach((tooltip) => {
				tooltip.classList.remove("is-active");
			});
		}
	});
};

const initInfo = () => {
	const items = document.querySelectorAll(".js-info");
	const information = document.querySelectorAll("[data-info]");
	if (!items.length || !information.length) return;
	// Create a map for faster lookup
	const infoMap = new Map();
	for (const info of information) {
		infoMap.set(info.dataset.info, info);
	}

	for (const item of items) {
		const triggers = item.querySelectorAll("strong");
		for (const trigger of triggers) {
			const triggerLabel = formatHandleize(trigger.textContent);
			const matchedInfo = infoMap.get(triggerLabel);
			if (matchedInfo) {
				const originalText = trigger.textContent.trim();
				const matchedTrigger = matchedInfo.querySelector(".js-tooltip-trigger");

				let suggestedTransform = "none";

				if (originalText === originalText.toUpperCase()) {
					suggestedTransform = "uppercase";
				} else if (originalText === originalText.toLowerCase()) {
					suggestedTransform = "lowercase";
				} else if (
					originalText
						.split(" ")
						.every((word) => word[0] === word[0]?.toUpperCase())
				) {
					suggestedTransform = "capitalize";
				}

				if (matchedTrigger) {
					matchedTrigger.style.textTransform = suggestedTransform;
				}

				trigger.replaceWith(matchedInfo.cloneNode(true));
			}
		}
	}
};

const initPopup = () => {
	function openPopup(trigger) {
		//trigger remove and add active state
		getSiblings(trigger).forEach((item) => {
			item.classList.remove("is-active");
		});
		trigger.classList.add("is-active");

		//find all matching targets
		let activeTarget = document.querySelector(
			`[data-popup-target="${trigger.dataset.popupTrigger}"]`
		);

		globalPopup.innerHTML = activeTarget.innerHTML;
		root.classList.add("is-popup-active");
		globalPopup.setAttribute("aria-hidden", false);
		globalPopup.setAttribute("tabindex", 0);
		globalOverlay.setAttribute("aria-hidden", false);
		globalOverlay.setAttribute("tabindex", 0);
		scrollDisable();

		// Play video if it exists
		const video = globalPopup.querySelector(".c-video");
		if (video) {
			handleVideoVisibility(true, video);
			video.querySelectorAll(".js-lazy-video").forEach((videoEl) => {
				loadLazyVideo(videoEl);
			});
		}
	}

	function closePopup() {
		root.classList.remove("is-popup-active");
		globalPopup.setAttribute("aria-hidden", true);
		globalPopup.setAttribute("tabindex", -1);

		globalOverlay.setAttribute("aria-hidden", true);
		globalOverlay.setAttribute("tabindex", -1);
		scrollEnable();

		setTimeout(() => {
			globalPopup.innerHTML = "";
		}, 400);
	}

	//match navigation with content
	on("body", "click", "[data-popup-trigger]", (e) => {
		// Prevent popup from being triggered on video control click
		if (e.target.closest(".js-video-control")) {
			return;
		}

		let trigger = e.target.closest("[data-popup-trigger]");
		openPopup(trigger);
	});

	on("body", "click", "[data-popup-close], .js-g-overlay", (e) => {
		closePopup();
	});

	on("body", "keydown", "body", (e) => {
		if (e.key == "Escape") {
			closePopup();
		}
	});
};

const initTooltip = () => {
	on("body", "click", ".js-tooltip-trigger", (e) => {
		const target = e.target.closest(".js-tooltip");
		target.classList.toggle(
			"is-active",
			!target.classList.contains("is-active")
		);

		document.querySelectorAll(".js-tooltip").forEach((tooltip) => {
			if (tooltip != target) {
				tooltip.classList.remove("is-active");
			}
		});
	});

	on("body", "mouseout", ".js-tooltip", (e) => {
		const target = e.target.closest(".js-tooltip");
		target.classList.remove("is-active");
	});

	document.addEventListener("click", function (event) {
		// Check if the click is outside any tooltip
		if (!event.target.closest(".js-tooltip")) {
			const tooltips = document.querySelectorAll(".js-tooltip.is-active");
			tooltips.forEach((tooltip) => {
				tooltip.classList.remove("is-active");
			});
		}
	});
};

const initFaqList = () => {
	const gladlyUrl = "https://amplifye.us-1.gladly.com";
	const orgId = "f6f7Pn3vQhahb6n5HFQcqQ";
	const originalFaqData = [];
	let latestSearchKeyword = "";

	// DOM references
	const container = document.querySelector(".js-faq-list");
	const limit = parseInt(container.dataset.faqLimit, 10) || 12;
	const emptyMessage = container?.dataset?.emptyMessage || "No FAQs found.";
	const template = document.querySelector("#template-accordion .c-accordion");
	const input = document.querySelector(".js-faq-search-input");
	const clearBtn = document.querySelector(".js-faq-search-clear");
	const blinkingCursor = document.querySelector(".js-faq-blinking-cursor");

	if (!container || !template) {
		console.warn("FAQ container or template not found.");
		return;
	}

	function updateCursor() {
		if (document.activeElement === input) {
			blinkingCursor.style.display = "none";
		} else {
			blinkingCursor.style.display =
				input.value.trim() === "" ? "block" : "none";
		}
	}

	input?.addEventListener("input", updateCursor);
	input?.addEventListener("focus", updateCursor);
	input?.addEventListener("blur", updateCursor);

	updateCursor();

	// Hide purchase bar when FAQ input is focused on mobile devices
	// In Firefox, the purchase bar can overlap the input field
	const purchaseBar = document.querySelector(".js-purchase-bar");

	input?.addEventListener("focus", () => {
		if (vs.isTouchDevice && purchaseBar) {
			purchaseBar.classList.remove("is-visible");
		}
	});
	input?.addEventListener("blur", () => {
		if (vs.isTouchDevice && purchaseBar) {
			purchaseBar.classList.add("is-visible");
		}
	});

	function normalizeHtml(html) {
		const wrapper = document.createElement("div");
		wrapper.innerHTML = html;

		// div => p.t-b-1
		wrapper.querySelectorAll("div").forEach((div) => {
			const p = document.createElement("p");
			p.className = "t-b-1";
			p.innerHTML = div.innerHTML;
			div.replaceWith(p);
		});

		// p.t-b-1 > <br> => <br>
		wrapper.querySelectorAll("p.t-b-1").forEach((p) => {
			// Check: only child is a single <br> (no text, no other nodes)
			if (
				p.childNodes.length === 1 &&
				p.firstChild.nodeType === Node.ELEMENT_NODE &&
				p.firstChild.tagName === "BR"
			) {
				p.replaceWith(p.firstChild); // swap <p> for its <br>
			}
		});

		return wrapper.innerHTML;
	}

	/**
	 * Render a list of FAQ items into the DOM
	 * @param {Array} list - List of FAQ items
	 * @param {boolean} includeId - Whether to attach data-answer-id on toggle button
	 */
	function renderFaqList(list, includeId = false) {
		list = list.slice(0, limit);
		container.innerHTML = "";
		container.classList.remove("has-faq");

		if (!Array.isArray(list) || list.length === 0) {
			const fallback = document.createElement("p");
			fallback.className = "f-h f-j-c t-h-4";
			fallback.textContent = emptyMessage;
			container.appendChild(fallback);
			return;
		}

		list.forEach(({ id, name: title, bodyHtml: content }) => {
			const clone = template.cloneNode(true);
			clone.querySelector(".c-accordion__title").innerHTML = title;

			clone.querySelector(".c-accordion__content-interior").innerHTML =
				normalizeHtml(content);

			if (includeId && id) {
				const btn = clone.querySelector("button.js-accordion-toggle");
				if (btn) btn.dataset.answerId = id;
			}

			container.appendChild(clone);
		});

		container.classList.add("has-faq");
	}

	/**
	 * Fetch FAQ list from Gladly
	 */
	function fetchFAQList() {
		const url = `${gladlyUrl}/api/v1/orgs/${orgId}/answers`;

		fetch(url)
			.then((res) => {
				if (!res.ok) throw new Error(`API error: ${res.status}`);
				return res.json();
			})
			.then((data) => {
				originalFaqData.splice(0, originalFaqData.length, ...(data || []));
				renderFaqList(originalFaqData);
			})
			.catch((error) => console.error("FAQ Fetch error:", error));
	}

	/**
	 * Perform a keyword search and render matching FAQs
	 * @param {string} query - Search term
	 */
	function searchFaq(query) {
		const url = `${gladlyUrl}/api/v1/orgs/${orgId}/answers-search?q=${encodeURIComponent(
			query
		)}`;

		fetch(url)
			.then((res) => {
				if (!res.ok) throw new Error(`Search error: ${res.status}`);
				return res.json();
			})
			.then((data) => {
				// Check: only render if query still matches
				if (query === latestSearchKeyword) {
					renderFaqList(data, true);
				}
			})
			.catch((error) => console.error("FAQ Search error:", error));
	}

	const debouncedSearchFaq = debounce(searchFaq, 300);

	/**
	 * Search field listener
	 */
	input?.addEventListener("input", (e) => {
		const keyword = e.target.value.trim();
		latestSearchKeyword = keyword;

		if (keyword.length > 2) {
			clearBtn.classList.add("is-visible");
			debouncedSearchFaq(keyword);
		} else {
			clearBtn.classList.remove("is-visible");
			renderFaqList(originalFaqData);
		}
	});

	/**
	 * Clear search input and reset the FAQ list
	 */
	clearBtn?.addEventListener("click", (e) => {
		e.preventDefault();
		input.value = "";
		latestSearchKeyword = "";
		clearBtn.classList.remove("is-visible");
		renderFaqList(originalFaqData);
		updateCursor();
	});

	/**
	 * Handles on-demand loading of full FAQ content when an accordion is expanded
	 */
	container.addEventListener("click", async (e) => {
		const btn = e.target.closest(".js-accordion-toggle[data-answer-id]");
		if (!btn) return;

		const accordion = btn.closest(".c-accordion");
		const contentInterior = accordion.querySelector(
			".c-accordion__content-interior"
		);
		const answerId = btn.dataset.answerId;

		// Already loaded
		if (btn.dataset.loaded) {
			accordion.refreshAccordion(accordion);
			return;
		}

		// Show loading state and adjust accordion height
		contentInterior.innerHTML = "<p>Loading...</p>";
		accordion.refreshAccordion(accordion);

		try {
			const url = `${gladlyUrl}/api/v1/orgs/${orgId}/answers/${answerId}`;
			const res = await fetch(url);
			if (!res.ok) throw new Error(res.status);
			const data = await res.json();

			contentInterior.innerHTML =
				normalizeHtml(data.bodyHtml) || "<p>No content</p>";
			btn.dataset.loaded = true;

			// Recalculate height after content injection
			requestAnimationFrame(() => accordion.refreshAccordion(accordion));
		} catch (err) {
			console.error("FAQ detail error:", err);
			contentInterior.innerHTML = "<p>Failed to load FAQ.</p>";
			requestAnimationFrame(() => accordion.refreshAccordion(accordion));
		}
	});

	// Initialize by fetching the full FAQ list
	fetchFAQList();
};

// Initiliaze Gladly Chat App
Gladly.init({
	appId: "amplifye.com",
})
	.then(function () {
		on("body", "click", ".js-gladly-trigger", (e) => {
			if (e.target.classList.contains("gladly-close")) {
				Gladly.close();
			} else {
				Gladly.show();
			}
		});
	})
	.catch(function (error) {
		console.error({ error });
	});

document.addEventListener("DOMContentLoaded", () => {
	// Run common initializations
	[
		initHeader,
		initVideo,
		initArticleCount,
		initMatch,
		initPopup,
		initTooltip,
		initInfo,
		initBenefitsAccordion,
		initShareButton,
	].forEach(safeRun);

	// Initialize PDP-specific features
	if (document.querySelector(".template-product")) safeRun(initPDP);
	// Initialize FAQ if the section exists
	if (document.querySelector(".js-faq-list")) safeRun(initFaqList);
});

// Safely run a function and catch errors
function safeRun(fn) {
	try {
		fn && fn();
	} catch (error) {
		console.error(`Init error in ${fn.name}:`, error);
	}
}

ariaFocusManager.init();

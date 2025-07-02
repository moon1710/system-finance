"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Shield, ArrowRight, Sparkles } from "lucide-react"

export default function Component() {
    const [isAdmin, setIsAdmin] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY })
        }
        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        // Simulate login process
        setTimeout(() => setIsLoading(false), 2000)
    }

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden relative" style={{ perspective: "1000px" }}>
            {/* Dynamic background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute w-96 h-96 bg-gradient-to-r from-gray-200/20 to-gray-300/20 rounded-full blur-3xl transition-all duration-1000"
                    style={{
                        left: mousePosition.x * 0.02,
                        top: mousePosition.y * 0.02,
                    }}
                />
                <div
                    className="absolute w-64 h-64 bg-gradient-to-r from-gray-400/10 to-gray-500/10 rounded-full blur-2xl transition-all duration-700"
                    style={{
                        right: mousePosition.x * -0.01,
                        bottom: mousePosition.y * -0.01,
                    }}
                />
            </div>

            {/* Left side - Enhanced 3D elements */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-white overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />

                {/* Dynamic 3D Geometric elements */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "800px" }}>
                    <div
                        className="relative transform-gpu transition-all duration-1000 hover:rotateY-12 hover:rotateX-6"
                        style={{
                            transform: `rotateY(${mousePosition.x * 0.01}deg) rotateX(${mousePosition.y * 0.01}deg)`,
                        }}
                    >
                        {/* Main 3D circular element with glass effect */}
                        <div
                            className="w-80 h-80 border border-gray-600/50 rounded-full flex items-center justify-center shadow-2xl transform-gpu transition-all duration-500 hover:shadow-gray-900/50 hover:scale-105 backdrop-blur-sm"
                            style={{
                                transformStyle: "preserve-3d",
                                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
                                background: "rgba(255, 255, 255, 0.02)",
                            }}
                        >
                            <div
                                className="w-60 h-60 border border-gray-500/50 rounded-full flex items-center justify-center shadow-xl transform-gpu transition-all duration-300 hover:translateZ-4 backdrop-blur-sm"
                                style={{
                                    transformStyle: "preserve-3d",
                                    boxShadow: "0 20px 40px -8px rgba(0, 0, 0, 0.6)",
                                    background: "rgba(255, 255, 255, 0.03)",
                                }}
                            >
                                <div
                                    className="w-40 h-40 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transform-gpu transition-all duration-200 hover:translateZ-8 hover:rotateY-180"
                                    style={{
                                        transformStyle: "preserve-3d",
                                        boxShadow: "0 15px 30px -6px rgba(0, 0, 0, 0.4)",
                                    }}
                                >
                                    <div className="w-20 h-20 bg-gray-900 rounded-full shadow-inner relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dynamic orbital dots */}
                        {[0, 90, 180, 270].map((angle, index) => (
                            <div
                                key={angle}
                                className="absolute w-4 h-4 rounded-full shadow-lg transition-all duration-500 cursor-pointer backdrop-blur-sm"
                                style={{
                                    left: "50%",
                                    top: "50%",
                                    transform: `translate(-50%, -50%) rotate(${angle + mousePosition.x * 0.1}deg) translateY(-160px) scale(${1 + Math.sin(Date.now() * 0.001 + index) * 0.2})`,
                                    background: index % 2 === 0 ? "rgba(255, 255, 255, 0.9)" : "rgba(156, 163, 175, 0.8)",
                                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.2)",
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Floating glass elements */}
                <div
                    className="absolute top-20 left-20 w-16 h-16 bg-white/10 backdrop-blur-md rounded-xl shadow-2xl transform-gpu transition-all duration-1000 hover:rotateX-45 hover:rotateY-45 hover:translateZ-8 border border-white/20"
                    style={{
                        transform: `translateY(${Math.sin(Date.now() * 0.001) * 10}px)`,
                    }}
                />
                <div
                    className="absolute bottom-32 right-16 w-12 h-12 bg-gray-800/20 backdrop-blur-md rounded-full shadow-xl transform-gpu transition-all duration-700 hover:rotateZ-180 hover:scale-125 border border-white/10"
                    style={{
                        transform: `translateX(${Math.cos(Date.now() * 0.0015) * 15}px)`,
                    }}
                />

                {/* Enhanced bottom text */}
                <div className="absolute bottom-12 left-12 text-white transform-gpu transition-all duration-500 hover:translateX-2 hover:translateZ-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="w-5 h-5 text-gray-400 animate-pulse" />
                        <h1 className="text-3xl font-light drop-shadow-lg">Creative Platform</h1>
                    </div>
                    <p className="text-gray-400 text-sm drop-shadow-md">Professional workspace management</p>
                </div>
            </div>

            {/* Right side - Glass morphism login form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Main glass login card */}
                    <div
                        className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl p-6 sm:p-8 transform-gpu transition-all duration-500 hover:translateY-2 hover:rotateX-2 cursor-pointer relative overflow-hidden"
                        style={{
                            transformStyle: "preserve-3d",
                            boxShadow:
                                "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                        }}
                    >
                        {/* Glass reflection effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none rounded-2xl" />

                        {/* Header with enhanced 3D icon */}
                        <div className="text-center mb-6 sm:mb-8 relative z-10">
                            <div
                                className="inline-flex items-center justify-center w-12 h-12 bg-gray-900/90 backdrop-blur-sm rounded-xl mb-4 shadow-lg transform-gpu transition-all duration-300 hover:rotateY-180 hover:scale-110 border border-white/10"
                                style={{ transformStyle: "preserve-3d" }}
                            >
                                {isAdmin ? <Shield className="w-6 h-6 text-white" /> : <User className="w-6 h-6 text-white" />}
                            </div>
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                                {isAdmin ? "Admin Access" : "Artist Portal"}
                            </h2>
                            <p className="text-gray-600 text-sm">
                                {isAdmin ? "Administrative dashboard login" : "Access your creative workspace"}
                            </p>
                        </div>

                        {/* Enhanced 3D toggle */}
                        <div className="flex items-center justify-center mb-6 sm:mb-8 relative z-10">
                            <div
                                className="flex items-center space-x-4 bg-gray-100/50 backdrop-blur-sm rounded-full p-1 border border-white/30 shadow-inner transform-gpu transition-all duration-300 hover:shadow-lg"
                                style={{ transformStyle: "preserve-3d" }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setIsAdmin(false)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform-gpu hover:translateZ-2 ${!isAdmin
                                        ? "bg-white/90 backdrop-blur-sm text-gray-900 shadow-lg hover:shadow-xl border border-white/20"
                                        : "text-gray-600 hover:text-gray-800 hover:bg-white/30"
                                        }`}
                                >
                                    Artist
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAdmin(true)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform-gpu hover:translateZ-2 ${isAdmin
                                        ? "bg-white/90 backdrop-blur-sm text-gray-900 shadow-lg hover:shadow-xl border border-white/20"
                                        : "text-gray-600 hover:text-gray-800 hover:bg-white/30"
                                        }`}
                                >
                                    Admin
                                </button>
                            </div>
                        </div>

                        {/* Dynamic form container */}
                        <div
                            className="relative z-10 transition-all duration-500 ease-in-out"
                            style={{
                                minHeight: isAdmin ? "140px" : "70px",
                            }}
                        >
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                <div className="space-y-4">
                                    {isAdmin ? (
                                        // Admin form with glass inputs
                                        <>
                                            <div className="space-y-2 transform transition-all duration-300">
                                                <Label htmlFor="username" className="text-gray-700 text-sm font-medium">
                                                    Username
                                                </Label>
                                                <Input
                                                    id="username"
                                                    type="text"
                                                    placeholder="Enter username"
                                                    className="bg-white/50 backdrop-blur-sm border-white/30 text-gray-900 placeholder:text-gray-500 focus:border-gray-900 focus:ring-gray-900/10 rounded-xl h-12 shadow-sm transform-gpu transition-all duration-300 hover:shadow-md hover:translateY-1 focus:translateY-1 focus:shadow-lg focus:bg-white/70"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2 transform transition-all duration-300">
                                                <Label htmlFor="password" className="text-gray-700 text-sm font-medium">
                                                    Password
                                                </Label>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    placeholder="Enter password"
                                                    className="bg-white/50 backdrop-blur-sm border-white/30 text-gray-900 placeholder:text-gray-500 focus:border-gray-900 focus:ring-gray-900/10 rounded-xl h-12 shadow-sm transform-gpu transition-all duration-300 hover:shadow-md hover:translateY-1 focus:translateY-1 focus:shadow-lg focus:bg-white/70"
                                                    required
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        // Artist form with glass input
                                        <div className="space-y-2 transform transition-all duration-300">
                                            <Label htmlFor="artistId" className="text-gray-700 text-sm font-medium">
                                                Artist ID
                                            </Label>
                                            <Input
                                                id="artistId"
                                                type="text"
                                                placeholder="Enter your artist ID"
                                                className="bg-white/50 backdrop-blur-sm border-white/30 text-gray-900 placeholder:text-gray-500 focus:border-gray-900 focus:ring-gray-900/10 rounded-xl h-12 shadow-sm transform-gpu transition-all duration-300 hover:shadow-md hover:translateY-1 focus:translateY-1 focus:shadow-lg focus:bg-white/70"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Enhanced 3D submit button */}
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gray-900/90 backdrop-blur-sm hover:bg-gray-800/90 text-white font-medium py-3 rounded-xl h-12 shadow-lg transform-gpu transition-all duration-300 hover:shadow-xl hover:translateY-1 hover:scale-105 active:translateY-0 active:scale-100 border border-white/10"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
                                            <span>Signing in...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center space-x-2">
                                            <span>Sign In</span>
                                            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translateX-1" />
                                        </div>
                                    )}
                                </Button>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 sm:mt-8 text-center relative z-10">
                            {/* Aquí poner la redirección a mail */}
                            <p className="text-gray-500 text-sm">Necesita asistencia? Puedes contactarnos</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

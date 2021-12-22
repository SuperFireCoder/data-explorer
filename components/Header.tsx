import { ComponentProps } from "react";
import { Header as EcHeader } from "@ecocommons-australia/ui-library";
import SignInOutButton from "./SignInOutButton";
import getConfig from "next/config";

const config = getConfig();

// This <Header /> injects the <SignInOutButton /> specific to this site

export default function Header(
    props: Omit<ComponentProps<typeof EcHeader>, "tabLinks">
) {
    return (
        <EcHeader
            signInOutButton={<SignInOutButton />}
            tabLinks={{
                ECOCOMMONS_ROOT:
                    config.publicRuntimeConfig
                        .NEXT_PUBLIC_UI_LIBRARY_HEADER_ECOCOMMONS_ROOT ?? "#",
                ECOCOMMONS_WORKSPACE:
                    config.publicRuntimeConfig
                        .NEXT_PUBLIC_UI_LIBRARY_HEADER_ECOCOMMONS_WORKSPACE ??
                    "#",
                ECOCOMMONS_DATASETS:
                    config.publicRuntimeConfig
                        .NEXT_PUBLIC_UI_LIBRARY_HEADER_ECOCOMMONS_DATASETS ??
                    "#",
                ECOCOMMONS_ANALYSIS_HUB:
                    config.publicRuntimeConfig
                        .NEXT_PUBLIC_UI_LIBRARY_HEADER_ECOCOMMONS_ANALYSIS_HUB ??
                    "#",
            }}
            useYellowStripedBackground={
                config.publicRuntimeConfig.NEXT_PUBLIC_DEPLOYMENT !==
                "production"
            }
            {...props}
        />
    );
}

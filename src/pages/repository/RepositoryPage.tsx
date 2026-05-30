import {PageContainer} from "../../components/PageWrapper/PageWrapper.tsx";

import {Alert, Breadcrumb, Button, Card, Flex, Skeleton, Space, Spin, Tabs, Typography} from "antd";
import React from "react";
import {useNavigate, useParams, useSearchParams} from "react-router";
import {BarChartOutlined, GithubOutlined, HomeOutlined, LineChartOutlined, ReloadOutlined, SettingOutlined} from "@ant-design/icons";
import {useQuery} from "@tanstack/react-query";
import {isOk} from "../../utils/axios.ts";
import useAxios from "../../context/auth/axios.ts";
import {colors} from "../../theme/theme.ts";

const RepoResultsTab = React.lazy(() =>
  import("./tabs/RepoResultsTab.tsx").then(m => ({default: m.RepoResultsTab}))
);
const RepoTrendsTab = React.lazy(() =>
  import("./tabs/RepoTrendsTab.tsx").then(m => ({default: m.RepoTrendsTab}))
);
const RepoConfigTab = React.lazy(() =>
  import("./tabs/RepoConfigTab.tsx").then(m => ({default: m.RepoConfigTab}))
);

const TabFallback = () => (
  <div style={{display: 'flex', justifyContent: 'center', padding: '48px 0'}}>
    <Spin />
  </div>
);

enum RepoPageTabs {
  RESULTS = 'results',
  TRENDS = 'trends',
  CONFIGS = 'configs',
}

export const RepositoryPage: React.FC = () => {

  const axios = useAxios();
  const {org: orgName, repo: repoName} = useParams();
  const [searchParams] = useSearchParams();

  const currentTab = searchParams.get('tab') || RepoPageTabs.RESULTS;
  const navigate = useNavigate();

  const updateUrlTab = (tab: string) => {
    navigate(`/gh/${orgName}/${repoName}?tab=${tab}`, {
      replace: true,
    });
  };

  const orgQuery = useQuery({
    queryKey: ["getOrgByName", orgName],
    enabled: !!orgName,
    queryFn: async () => {
      const response = await axios.get(`/v1/gh/org?org_name=${orgName}`);
      if (!isOk(response)) {
        throw new Error("Network response was not ok");
      }
      return response.data;
    },
  });

  const repoQuery = useQuery({
    queryKey: ["getRepoByOrgIdAndName", orgName],
    enabled: (!!repoName) && (!!orgQuery.data) && (orgQuery.data.id !== undefined),
    queryFn: async () => {
      const response = await axios.get(`/v1/org/${orgQuery.data.id}/repo?repo_name=${repoName}`);
      if (!isOk(response)) {
        throw new Error("Network response was not ok");
      }
      return response.data;
    },
  });

  const isLoading = orgQuery.isLoading || repoQuery.isLoading;
  const isError = orgQuery.isError || repoQuery.isError;

  const handleRetry = () => {
    if (orgQuery.isError) {
      orgQuery.refetch();
    } else {
      repoQuery.refetch();
    }
  };

  return (
    <PageContainer>
      <Card
        style={{borderRadius: 12}}
        styles={{body: {padding: 32}}}
      >
        <Breadcrumb
          items={[
            {
              href: '/gh/orgs',
              title: <><HomeOutlined /> Organizations</>,
            },
            {
              href: `/gh/${orgName}`,
              title: orgName,
            },
            {
              title: repoName,
            },
          ]}
          style={{marginBottom: 16}}
        />
        <Flex justify="space-between" align="center" style={{marginBottom: 8}}>
          <Space size={12}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: colors.primaryLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GithubOutlined style={{fontSize: 20, color: colors.primary}} />
            </div>
            <div>
              <Typography.Title level={3} style={{margin: 0}}>
                {repoName}
              </Typography.Title>
              <Typography.Text type="secondary" style={{fontSize: 13}}>
                {orgName}/{repoName}
              </Typography.Text>
            </div>
          </Space>
          <Button
            type="text"
            icon={<GithubOutlined />}
            href={`https://github.com/${orgName}/${repoName}`}
            target="_blank"
            aria-label="View on GitHub"
          >
            View on GitHub
          </Button>
        </Flex>

        {isLoading ? (
          <Spin tip="Loading repository...">
            <div style={{padding: '24px 0'}}>
              <Skeleton active paragraph={{rows: 4}} />
            </div>
          </Spin>
        ) : isError ? (
          <Alert
            title="Failed to load repository"
            description="We couldn't fetch the repository details. Please check your connection and try again."
            type="error"
            showIcon
            action={
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleRetry}
              >
                Retry
              </Button>
            }
          />
        ) : (
          <Tabs
            activeKey={currentTab}
            onChange={(key: string) => {
              if (key === RepoPageTabs.CONFIGS || key === RepoPageTabs.RESULTS || key === RepoPageTabs.TRENDS) {
                updateUrlTab(key);
              }
            }}
            items={[
              {
                key: RepoPageTabs.RESULTS,
                label: <Space><BarChartOutlined />Results</Space>,
                children: (
                  <React.Suspense fallback={<TabFallback />}>
                    <RepoResultsTab repository={repoQuery.data} organization={orgQuery.data}/>
                  </React.Suspense>
                )
              },
              {
                key: RepoPageTabs.TRENDS,
                label: <Space><LineChartOutlined />Trends</Space>,
                children: (
                  <React.Suspense fallback={<TabFallback />}>
                    <RepoTrendsTab repository={repoQuery.data} organization={orgQuery.data}/>
                  </React.Suspense>
                )
              },
              {
                key: RepoPageTabs.CONFIGS,
                label: <Space><SettingOutlined />Settings</Space>,
                children: (
                  <React.Suspense fallback={<TabFallback />}>
                    <RepoConfigTab repository={repoQuery.data} organization={orgQuery.data}/>
                  </React.Suspense>
                )
              }
            ]}
          />
        )}
      </Card>
    </PageContainer>
  );
};
